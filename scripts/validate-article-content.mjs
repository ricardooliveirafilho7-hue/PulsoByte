import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  loadEditorialConfig,
  normalizeText,
  isValidCalendarDate,
  todayInTimezone,
  compareIsoDates,
  parseAutomationRunId,
  parseAutomationBranch,
  classifySourceUrl,
  extractSourceUrls,
  extractUsedMdxComponents,
  parseRegisteredMdxComponents,
  lexicalSimilarity,
} from "./lib/editorial.mjs";

/**
 * Validação editorial de conteúdo.
 *
 * Valores compartilhados (slots, formatos, limites, padrões de identidade,
 * componentes MDX permitidos) vêm de automation/editorial-config.json.
 *
 * O que este script PROVA é determinístico: identidade, datas semânticas,
 * duplicidade exata, diversidade estrutural entre turnos e similaridade
 * LEXICAL (shingles/Jaccard). Julgamento semântico fino de pauta continua
 * sendo responsabilidade editorial do agente (ver docs/automation-editorial.md).
 */

const root = process.cwd();
const config = loadEditorialConfig(root);
const articlesDir = path.join(root, "content", "articles");

const categorySource = fs.readFileSync(path.join(root, "src", "config", "categories.ts"), "utf8");
const validCategories = new Set(
  [...categorySource.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].map((match) => match[1])
);
const validContentTypes = new Set(config.editorial.contentTypes);
const validSlots = new Set(Object.keys(config.slots));
const validIntents = new Set(config.editorial.searchIntents);
const allowedComponents = new Set(config.mdxComponents);
const minimumWords = config.editorial.minimumWords;
const automationFields = config.identity.automationFields;
const today = todayInTimezone(config.timezone);

const records = [];
const errors = [];
const warnings = [];

function fail(file, problem) {
  errors.push(`${file}: ${problem}`);
}

function countVisibleWords(content) {
  const jsxStrings = [...content.matchAll(/<[^>]+>/gs)]
    .flatMap((match) => [...match[0].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]))
    .filter((value) => !/^https?:\/\//i.test(value));

  const visible = `${content.replace(/```[\s\S]*?```/g, " ").replace(/<[^>]+>/gs, " ")} ${jsxStrings.join(" ")}`
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, " $1 ")
    .replace(/[{}[\]()*_#>|~=:+-]/g, " ");

  return visible.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

// --- Registro MDX: a allowlist da config e o renderer real não podem divergir.
const mdxContentSource = fs.readFileSync(
  path.join(root, "src", "components", "mdx", "MdxContent.tsx"),
  "utf8"
);
const registered = parseRegisteredMdxComponents(mdxContentSource);
const allowlistSorted = [...allowedComponents].sort();
if (JSON.stringify(registered) !== JSON.stringify(allowlistSorted)) {
  const onlyRegistered = registered.filter((name) => !allowedComponents.has(name));
  const onlyAllowlist = allowlistSorted.filter((name) => !registered.includes(name));
  const parts = [];
  if (onlyRegistered.length) parts.push(`registrados no renderer mas fora da config: ${onlyRegistered.join(", ")}`);
  if (onlyAllowlist.length) parts.push(`na config mas ausentes do renderer: ${onlyAllowlist.join(", ")}`);
  errors.push(
    `automation/editorial-config.json (mdxComponents) diverge de src/components/mdx/MdxContent.tsx — ${parts.join("; ")}.`
  );
}

for (const file of fs.readdirSync(articlesDir).filter((name) => name.endsWith(".mdx")).sort()) {
  const raw = fs.readFileSync(path.join(articlesDir, file), "utf8");
  let parsed;
  try {
    parsed = matter(raw);
  } catch (error) {
    fail(file, `frontmatter inválido (${error.message}).`);
    continue;
  }

  const { data, content } = parsed;
  const expectedSlug = file.replace(/\.mdx$/, "");
  if (data.slug !== expectedSlug) fail(file, `slug deve ser exatamente "${expectedSlug}".`);
  if (!validCategories.has(data.category)) fail(file, `categoria inválida: "${String(data.category)}".`);
  if (data.contentType !== undefined && !validContentTypes.has(data.contentType)) {
    fail(file, `contentType inválido: "${String(data.contentType)}".`);
  }

  // Datas: validação semântica para TODOS os artigos.
  for (const field of ["publishedAt", "updatedAt"]) {
    if (data[field] !== undefined && !isValidCalendarDate(String(data[field]))) {
      fail(file, `${field} "${String(data[field])}" não é uma data de calendário válida (AAAA-MM-DD).`);
    }
  }
  if (
    isValidCalendarDate(String(data.publishedAt)) &&
    isValidCalendarDate(String(data.updatedAt)) &&
    compareIsoDates(String(data.updatedAt), String(data.publishedAt)) < 0
  ) {
    fail(file, `updatedAt (${data.updatedAt}) anterior a publishedAt (${data.publishedAt}).`);
  }

  for (const component of extractUsedMdxComponents(content)) {
    if (!allowedComponents.has(component)) fail(file, `componente MDX não registrado: <${component}>.`);
  }
  for (const match of content.matchAll(/\]\(\/artigos\/([a-z0-9-]+)(?:[?#][^)]*)?\)/g)) {
    const target = path.join(articlesDir, `${match[1]}.mdx`);
    if (!fs.existsSync(target)) fail(file, `link interno aponta para artigo inexistente: ${match[1]}.`);
  }

  const isAutomated = automationFields.some((field) => data[field] !== undefined);
  const sourceUrls = [...new Set(extractSourceUrls(content))];

  if (isAutomated) {
    for (const field of automationFields) {
      if (typeof data[field] !== "string" || data[field].trim() === "") {
        fail(file, `artigo automático exige ${field}.`);
      }
    }
    if (!validSlots.has(data.publicationSlot)) fail(file, "publicationSlot deve ser morning ou evening.");
    if (!validIntents.has(data.searchIntent)) fail(file, "searchIntent inválido.");

    const runId = parseAutomationRunId(data.automationRunId, config);
    if (!runId) {
      fail(file, `automationRunId "${String(data.automationRunId)}" fora do formato AAAA-MM-DD-morning|evening ou com data inexistente.`);
    } else {
      if (data.automationRunId !== `${data.publishedAt}-${data.publicationSlot}`) {
        fail(file, "automationRunId deve combinar publishedAt e publicationSlot.");
      }
      if (isValidCalendarDate(String(data.publishedAt)) && compareIsoDates(String(data.publishedAt), today) > 0) {
        fail(file, `publishedAt (${data.publishedAt}) está no futuro em relação à data editorial de hoje (${today}, ${config.timezone}).`);
      }
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.topicKey ?? "")) {
      fail(file, "topicKey deve usar apenas minúsculas, números e hífens.");
    }
    if (data.author !== config.identity.requiredAuthor) {
      fail(file, `author automático deve ser ${config.identity.requiredAuthor}.`);
    }
    if (data.status !== "published") fail(file, "artigo automático deve chegar ao PR como published.");
    if (!/<(?:Sources|SourceList)\b/.test(content)) {
      fail(file, "artigo automático precisa do componente Sources ou SourceList.");
    }

    // Fontes: quantidade, qualidade e domínios registráveis distintos.
    const httpsUrls = sourceUrls.filter((url) => url.startsWith("https://"));
    if (httpsUrls.length < config.sources.minHttpsUrls) {
      fail(file, `artigo automático precisa de pelo menos ${config.sources.minHttpsUrls} URLs HTTPS distintas nas fontes (encontradas: ${httpsUrls.length}).`);
    }
    const domains = new Set();
    for (const url of sourceUrls) {
      const result = classifySourceUrl(url);
      if (!result.ok) fail(file, `fonte rejeitada (${result.reason}): ${url}`);
      else domains.add(result.domain);
    }
    if (domains.size < config.sources.minRegistrableDomains) {
      fail(
        file,
        `fontes precisam cobrir pelo menos ${config.sources.minRegistrableDomains} domínios registráveis distintos (encontrados: ${[...domains].join(", ") || "nenhum"}). Duas páginas da mesma organização não são confirmações independentes.`
      );
    }
    if (data.primarySourceUrl !== undefined) {
      const primary = classifySourceUrl(String(data.primarySourceUrl));
      if (!primary.ok) {
        fail(file, `primarySourceUrl rejeitada (${primary.reason}): ${String(data.primarySourceUrl)}`);
      } else if (!sourceUrls.includes(String(data.primarySourceUrl))) {
        fail(file, "primarySourceUrl precisa aparecer na lista final de fontes do artigo.");
      }
    } else {
      warnings.push(`${file}: sem primarySourceUrl declarada — confirme que realmente não existe fonte primária para a pauta.`);
    }

    const words = countVisibleWords(content);
    const floor = minimumWords[data.contentType] ?? config.editorial.defaultMinimumWords;
    if (words < floor) fail(file, `conteúdo automático tem ${words} palavras visíveis; mínimo para ${data.contentType ?? "o formato"}: ${floor}.`);
    if (/\b(revolucion[aá]rio|vai mudar tudo|garantido|sem nenhum risco|100% seguro)\b/i.test(content)) {
      fail(file, "afirmação absoluta ou promocional proibida encontrada.");
    }
  }

  records.push({ file, data, isAutomated, description: data.description });
}

// --- Duplicidade exata.
for (const field of ["slug", "title", "automationRunId", "topicKey"]) {
  const seen = new Map();
  for (const record of records) {
    const value = field === "title" ? normalizeText(record.data[field]) : record.data[field];
    if (!value) continue;
    const previous = seen.get(value);
    if (previous) fail(record.file, `${field} duplica ${previous}.`);
    else seen.set(value, record.file);
  }
}

// --- Limites por data editorial e diversidade entre manhã e noite.
const perDate = new Map();
for (const record of records.filter((item) => item.isAutomated && item.data.status === "published")) {
  const date = record.data.publishedAt;
  const list = perDate.get(date) ?? [];
  list.push(record);
  perDate.set(date, list);
}
for (const [date, list] of perDate) {
  if (list.length > config.limits.articlesPerDate) {
    errors.push(`${date}: mais de ${config.limits.articlesPerDate} artigos automáticos publicados.`);
  }
  for (const slot of validSlots) {
    if (list.filter((record) => record.data.publicationSlot === slot).length > 1) {
      errors.push(`${date}: turno ${slot} duplicado.`);
    }
  }
  const morning = list.find((record) => record.data.publicationSlot === "morning");
  const evening = list.find((record) => record.data.publicationSlot === "evening");
  if (morning && evening) {
    if (
      normalizeText(morning.data.primaryEntity) !== "" &&
      normalizeText(morning.data.primaryEntity) === normalizeText(evening.data.primaryEntity)
    ) {
      errors.push(`${date}: manhã e noite repetem a mesma primaryEntity ("${morning.data.primaryEntity}").`);
    }
    if (morning.data.searchIntent === evening.data.searchIntent) {
      errors.push(`${date}: manhã e noite repetem a mesma searchIntent ("${morning.data.searchIntent}").`);
    }
  }
}

// --- Similaridade lexical determinística entre artigos automáticos.
const automated = records.filter((record) => record.isAutomated);
for (let i = 0; i < automated.length; i++) {
  for (let j = i + 1; j < automated.length; j++) {
    const a = automated[i];
    const b = automated[j];
    const textA = `${a.data.title ?? ""} ${a.description ?? ""}`;
    const textB = `${b.data.title ?? ""} ${b.description ?? ""}`;
    const similarity = lexicalSimilarity(textA, textB, config.similarity.shingleSize);
    if (similarity >= config.similarity.blockThreshold) {
      errors.push(
        `${a.file} e ${b.file}: similaridade lexical ${similarity.toFixed(2)} ≥ ${config.similarity.blockThreshold} (título+descrição praticamente idênticos).`
      );
    } else if (similarity >= config.similarity.warnThreshold) {
      warnings.push(
        `${a.file} e ${b.file}: similaridade lexical ${similarity.toFixed(2)} na zona intermediária — exige conferência editorial de que as pautas são materialmente diferentes.`
      );
    }
  }
}

// --- Coerência entre branch, data, turno e artigo.
const branch = process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME || "";
if (branch.startsWith("automation/artigo-")) {
  const parsedBranch = parseAutomationBranch(branch, config);
  if (!parsedBranch) {
    errors.push(`branch automática inválida (padrão ou data inexistente): ${branch}.`);
  } else {
    const matching = records.filter(
      (record) =>
        record.data.publishedAt === parsedBranch.date &&
        record.data.publicationSlot === parsedBranch.slot
    );
    if (matching.length !== 1) {
      errors.push(
        `branch ${branch} precisa corresponder a exatamente um artigo ${parsedBranch.slot} de ${parsedBranch.date} (encontrados: ${matching.length}).`
      );
    } else if (matching[0].data.slug !== parsedBranch.slug) {
      errors.push(
        `branch ${branch} indica o slug "${parsedBranch.slug}", mas o artigo do turno é "${matching[0].data.slug}".`
      );
    }
  }
}

// --- Disponibilidade das fontes (opcional; ver política no runbook).
if (process.env.VALIDATE_SOURCE_AVAILABILITY === "1") {
  for (const record of automated) {
    const raw = fs.readFileSync(path.join(articlesDir, record.file), "utf8");
    const urls = [...new Set(extractSourceUrls(matter(raw).content))];
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(10000),
          headers: { "user-agent": "PulsoByteEditorialBot/1.0 (+validacao de fontes)" },
        });
        if (response.status === 404 || response.status === 410) {
          fail(record.file, `fonte confirmadamente inexistente (HTTP ${response.status}): ${url}`);
        } else if (response.status === 401 || response.status === 403 || response.status === 429) {
          warnings.push(`${record.file}: fonte com bloqueio de acesso/anti-bot (HTTP ${response.status}), não conta como 404: ${url}`);
        } else if (!response.ok) {
          warnings.push(`${record.file}: fonte respondeu HTTP ${response.status}; verifique manualmente: ${url}`);
        }
      } catch (error) {
        if (error.name === "TimeoutError" || error.name === "AbortError") {
          warnings.push(`${record.file}: timeout ao verificar fonte (não conta como 404): ${url}`);
        } else if (error.cause?.code === "ENOTFOUND") {
          fail(record.file, `domínio da fonte não resolve (ENOTFOUND): ${url}`);
        } else {
          warnings.push(`${record.file}: falha transitória ao verificar fonte (${error.message}): ${url}`);
        }
      }
    }
  }
}

if (warnings.length) {
  console.warn(`\nAvisos editoriais:\n${warnings.join("\n")}\n`);
}

if (errors.length) {
  console.error(`\nValidação editorial falhou (${errors.length} erro(s)):\n\n${errors.join("\n")}`);
  process.exit(1);
}

console.log(
  `Conteúdo validado: ${records.length} artigo(s), ${records.filter((record) => record.isAutomated).length} automático(s).`
);
