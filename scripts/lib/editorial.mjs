import fs from "node:fs";
import path from "node:path";

/**
 * Funções puras compartilhadas pela automação editorial.
 * Os valores vêm de automation/editorial-config.json — fonte única de
 * configuração. Não codifique horários, regex de branch ou limites aqui.
 */

export function loadEditorialConfig(root = process.cwd()) {
  const configPath = path.join(root, "automation", "editorial-config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.schemaVersion !== 1) {
    throw new Error(`editorial-config.json: schemaVersion ${config.schemaVersion} não suportado.`);
  }
  return config;
}

/** Normaliza texto para comparação: sem acentos, minúsculas, só [a-z0-9 ]. */
export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Valida uma data AAAA-MM-DD semanticamente: formato, ano com exatamente
 * quatro dígitos em faixa plausível, mês 01–12 e dia existente no calendário
 * (2026-02-30 e 2026-13-01 são rejeitados).
 */
export function isValidCalendarDate(value) {
  if (typeof value !== "string") return false;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2000 || year > 2200) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Data de hoje (AAAA-MM-DD) resolvida no fuso informado. */
export function todayInTimezone(timezone, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Compara datas AAAA-MM-DD lexicograficamente (válido para o formato). */
export function compareIsoDates(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Interpreta um automationRunId. Retorna { date, slot } ou null. */
export function parseAutomationRunId(runId, config) {
  const pattern = new RegExp(config.identity.automationRunIdPattern);
  const match = typeof runId === "string" ? runId.match(pattern) : null;
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (!isValidCalendarDate(date)) return null;
  return { date, slot: match[4] };
}

/** Interpreta uma branch automation/artigo-*. Retorna { date, slot, slug } ou null. */
export function parseAutomationBranch(branch, config) {
  const pattern = new RegExp(config.identity.branchPattern);
  const match = typeof branch === "string" ? branch.match(pattern) : null;
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (!isValidCalendarDate(date)) return null;
  const slot = Object.entries(config.slots).find(
    ([, value]) => value.branchToken === match[4]
  )?.[0];
  if (!slot) return null;
  return { date, slot, slug: match[5] };
}

/**
 * Domínio registrável aproximado de um hostname (heurística com os sufixos
 * compostos mais comuns; suficiente para distinguir "duas fontes do mesmo
 * veículo" de "dois domínios distintos"). Documentado como heurística — não
 * é uma implementação completa da Public Suffix List.
 */
const MULTI_LABEL_SUFFIXES = new Set([
  "com.br", "net.br", "org.br", "gov.br", "edu.br", "leg.br", "jus.br", "mil.br",
  "co.uk", "org.uk", "ac.uk", "gov.uk",
  "com.au", "net.au", "org.au",
  "co.jp", "or.jp", "ne.jp",
  "com.mx", "com.ar", "com.co", "com.pt", "co.in", "com.cn",
]);

export function registrableDomain(hostname) {
  const labels = String(hostname).toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  if (MULTI_LABEL_SUFFIXES.has(lastTwo)) return labels.slice(-3).join(".");
  return lastTwo;
}

/**
 * Detecta URLs de fonte obviamente inadequadas: placeholders, páginas de
 * busca e homepages genéricas sem caminho.
 */
export function classifySourceUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "URL inválida" };
  }
  if (parsed.protocol !== "https:") return { ok: false, reason: "protocolo não é HTTPS" };
  const host = parsed.hostname.toLowerCase();
  if (/(^|\.)example\.(com|org|net)$/.test(host) || host === "localhost") {
    return { ok: false, reason: "URL de placeholder" };
  }
  const searchPath = /^\/(search|s|busca|buscar|results?)\/?$/i.test(parsed.pathname);
  const searchQuery = /(^|&)(q|query|search)=/i.test(parsed.search.replace(/^\?/, ""));
  if (searchPath || (searchQuery && parsed.pathname === "/")) {
    return { ok: false, reason: "página de busca não é fonte" };
  }
  if (parsed.pathname === "/" || parsed.pathname === "") {
    return { ok: false, reason: "homepage genérica não é fonte direta" };
  }
  return { ok: true, domain: registrableDomain(host) };
}

/** Extrai as URLs declaradas como fontes (props url: "https://...") do MDX. */
export function extractSourceUrls(content) {
  return [...content.matchAll(/\burl:\s*["'](https?:\/\/[^"']+)["']/g)].map((m) => m[1]);
}

/** Componentes MDX (PascalCase) usados em um artigo. */
export function extractUsedMdxComponents(content) {
  return [...new Set([...content.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1]))];
}

/**
 * Lê as chaves do mapa `const components = { ... }` de MdxContent.tsx.
 * Usado para provar que o registro real do renderer e a allowlist da
 * configuração compartilhada nunca divergem silenciosamente.
 */
export function parseRegisteredMdxComponents(tsxSource) {
  const match = tsxSource.match(/const components\s*=\s*\{([\s\S]*?)\n\};/);
  if (!match) throw new Error("MdxContent.tsx: mapa `const components = { ... }` não encontrado.");
  const body = match[1];
  const names = new Set();
  for (const line of body.split("\n")) {
    const entry = line.match(/^\s*([A-Za-z][A-Za-z0-9]*)\s*[:,]/);
    if (entry) {
      const name = entry[1];
      // Somente componentes PascalCase são permitidos em artigos; chaves
      // minúsculas (ex.: table) são overrides internos de elementos HTML.
      if (/^[A-Z]/.test(name)) names.add(name);
    }
  }
  return [...names].sort();
}

/** Shingles de n palavras a partir do texto normalizado. */
function shingles(text, size) {
  const words = normalizeText(text).split(" ").filter(Boolean);
  if (words.length === 0) return new Set();
  if (words.length <= size) return new Set([words.join(" ")]);
  const result = new Set();
  for (let i = 0; i <= words.length - size; i++) {
    result.add(words.slice(i, i + size).join(" "));
  }
  return result;
}

/**
 * Similaridade lexical determinística (Jaccard sobre shingles de palavras).
 * Isto NÃO é similaridade semântica: o CI prova apenas sobreposição lexical.
 * Julgamento semântico fino continua sendo responsabilidade editorial do
 * agente, como documentado no runbook.
 */
export function lexicalSimilarity(a, b, size = 3) {
  const setA = shingles(a, size);
  const setB = shingles(b, size);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Allowlist do diff de um PR editorial automático.
 * `changes`: [{ status, file }] vindos de git diff --name-status.
 * Permite somente: um novo artigo MDX, uma nova capa com o mesmo slug,
 * até `maxInternalImages` imagens internas novas e a atualização do
 * manifesto editorial gerado (`catalogPath`).
 */
export function validateEditorialScope(changes, config) {
  const errors = [];
  const catalogPath = config.catalog.path;
  const maxInternal = config.limits.maxInternalImages;
  let article = null;
  let cover = null;
  const internals = [];
  let catalogChanged = false;

  for (const { status, file } of changes) {
    if (file === catalogPath) {
      if (status !== "M" && status !== "A") {
        errors.push(`manifesto editorial não pode ser ${status === "D" ? "apagado" : `alterado com status ${status}`}: ${file}`);
      }
      catalogChanged = true;
      continue;
    }
    if (status !== "A") {
      errors.push(`PR editorial automático só pode adicionar arquivos novos (${status} ${file}).`);
      continue;
    }
    if (/^content\/articles\/[a-z0-9-]+\.mdx$/.test(file)) {
      if (article) errors.push(`mais de um artigo novo no PR: ${article} e ${file}.`);
      article = file;
    } else if (/^public\/images\/articles\/[a-z0-9-]+\.webp$/.test(file)) {
      internals.push(file);
    } else {
      errors.push(`arquivo fora da allowlist editorial: ${file}`);
    }
  }

  if (!article) {
    errors.push("PR editorial automático precisa adicionar exatamente um artigo MDX novo.");
  } else {
    const slug = article.replace(/^content\/articles\//, "").replace(/\.mdx$/, "");
    const expectedCover = `public/images/articles/${slug}.webp`;
    const coverIndex = internals.indexOf(expectedCover);
    if (coverIndex === -1) {
      errors.push(`capa nova obrigatória não encontrada: ${expectedCover}.`);
    } else {
      cover = expectedCover;
      internals.splice(coverIndex, 1);
    }
    if (internals.length > maxInternal) {
      errors.push(`máximo de ${maxInternal} imagens internas novas; encontradas ${internals.length}.`);
    }
  }
  if (!catalogChanged) {
    errors.push(`manifesto editorial ${catalogPath} precisa ser atualizado no mesmo PR (gere com npm run catalog:generate).`);
  }

  return { ok: errors.length === 0, errors, article, cover, internalImages: internals };
}

/**
 * Detecção de duplicidade/concorrência para um automationRunId.
 * Entradas são dados já coletados (catálogo integrado, PRs, branches) para
 * permitir teste determinístico. Retorna a lista de conflitos, cada um
 * nomeando exatamente o objeto concorrente encontrado.
 */
export function findRunConflicts({
  runId,
  date,
  slot,
  topicKey,
  prNumber,
  headBranch,
  catalogArticles = [],
  openPrs = [],
  branches = [],
}, config) {
  const conflicts = [];

  for (const article of catalogArticles) {
    if (article.automationRunId === runId) {
      conflicts.push(`artigo já integrado com o mesmo automationRunId: ${article.file ?? article.slug} (${runId}).`);
    } else if (article.publicationSlot === slot && article.publishedAt === date && article.status === "published") {
      conflicts.push(`turno ${slot} de ${date} já ocupado pelo artigo integrado ${article.file ?? article.slug}.`);
    }
    if (topicKey && article.topicKey === topicKey) {
      conflicts.push(`topicKey "${topicKey}" já usado pelo artigo integrado ${article.file ?? article.slug}.`);
    }
  }

  for (const pr of openPrs) {
    if (prNumber !== undefined && pr.number === prNumber) continue;
    const parsed = parseAutomationBranch(pr.headRef ?? "", config);
    if (!parsed) continue;
    if (`${parsed.date}-${parsed.slot}` === runId) {
      conflicts.push(`PR aberto #${pr.number} (${pr.headRef}) usa o mesmo automationRunId ${runId}.`);
    } else if (parsed.date === date && parsed.slot === slot) {
      conflicts.push(`PR aberto #${pr.number} (${pr.headRef}) disputa o mesmo turno ${slot} de ${date}.`);
    }
  }

  for (const branch of branches) {
    if (headBranch && branch === headBranch) continue;
    const parsed = parseAutomationBranch(branch, config);
    if (!parsed) continue;
    if (parsed.date === date && parsed.slot === slot) {
      conflicts.push(`branch concorrente do mesmo turno: ${branch}.`);
    }
  }

  return conflicts;
}

/**
 * Estados reconhecidos de uma execução editorial (retomada segura).
 * Ver docs/automation-editorial.md, seção "Retomada de execução".
 */
export const RUN_STATES = [
  "PUBLISHED_VERIFIED",
  "MERGED_AWAITING_PRODUCTION",
  "PR_OPEN_CI_RUNNING",
  "PR_OPEN_CI_FAILED",
  "PR_OPEN_CI_PASSED",
  "BRANCH_WITHOUT_PR",
  "ABANDONED",
  "BLOCKED_BEFORE_BRANCH",
  "NOT_STARTED",
];

/**
 * Classifica o estado de um automationRunId a partir de sinais já coletados.
 * Retorna { state, action, detail }. `action` é a única ação segura:
 *   resume-pr   → continuar na MESMA branch e MESMO PR;
 *   resume-branch → abrir PR para a branch existente (sem nova branch);
 *   wait        → aguardar CI/produção, sem criar nada;
 *   verify      → rodar smoke test de produção;
 *   done        → nada a fazer;
 *   start       → nenhuma execução anterior: pode iniciar do zero;
 *   stop        → encerrar com bloqueio explícito, sem criar objetos novos.
 */
export function classifyRunState({
  integratedArticle = null,
  productionVerified = false,
  openPr = null,
  ciStatus = null,
  branchExists = false,
  branchStaleHours = 0,
  blockedMarker = null,
}) {
  if (integratedArticle) {
    return productionVerified
      ? { state: "PUBLISHED_VERIFIED", action: "done", detail: "artigo integrado e produção verificada." }
      : { state: "MERGED_AWAITING_PRODUCTION", action: "verify", detail: "PR integrado; confirmar produção e smoke test." }
  }
  if (openPr) {
    if (ciStatus === "failure") {
      return { state: "PR_OPEN_CI_FAILED", action: "resume-pr", detail: `corrigir na mesma branch do PR #${openPr}.` };
    }
    if (ciStatus === "success") {
      return { state: "PR_OPEN_CI_PASSED", action: "wait", detail: `PR #${openPr} validado; aguardar o merge do workflow.` };
    }
    return { state: "PR_OPEN_CI_RUNNING", action: "wait", detail: `CI do PR #${openPr} em andamento; não criar nada novo.` };
  }
  if (branchExists) {
    if (branchStaleHours > 24) {
      return { state: "ABANDONED", action: "stop", detail: "branch antiga sem PR; exige decisão humana antes de reutilizar." };
    }
    return { state: "BRANCH_WITHOUT_PR", action: "resume-branch", detail: "abrir PR não-draft para a branch existente; não criar segunda branch." };
  }
  if (blockedMarker) {
    return { state: "BLOCKED_BEFORE_BRANCH", action: "stop", detail: `execução anterior bloqueada (${blockedMarker}); não repetir sem resolver a causa.` };
  }
  return { state: "NOT_STARTED", action: "start", detail: "nenhuma execução anterior para este automationRunId." };
}

/**
 * Decide o que fazer quando a base (branch padrão) muda entre a validação e
 * o merge. Máximo de `maxAttempts` revalidações automáticas; a partir daí o
 * merge é abortado com estado explícito e o PR fica aberto para recuperação.
 */
export function planBaseRevalidation({ validatedBase, currentBase, attempts, maxAttempts }) {
  if (validatedBase === currentBase) {
    return { action: "merge", reason: "base inalterada desde a validação." };
  }
  if (attempts >= maxAttempts) {
    return {
      action: "abort",
      reason: `base mudou novamente (${validatedBase.slice(0, 7)} → ${currentBase.slice(0, 7)}) após ${attempts} revalidação(ões); limite de ${maxAttempts} atingido. PR permanece aberto.`,
    };
  }
  return {
    action: "revalidate",
    reason: `base avançou de ${validatedBase.slice(0, 7)} para ${currentBase.slice(0, 7)}; revalidação ${attempts + 1}/${maxAttempts}.`,
  };
}
