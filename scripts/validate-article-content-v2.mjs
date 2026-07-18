import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  loadEditorialConfig,
  normalizeText,
  isValidCalendarDate,
  todayInTimezone,
  compareIsoDates,
  classifySourceUrl,
  extractSourceUrls,
  extractUsedMdxComponents,
  parseRegisteredMdxComponents,
  lexicalSimilarity,
} from "./lib/editorial.mjs";

const root = process.cwd();
const config = loadEditorialConfig(root);
const articlesDir = path.join(root, "content", "articles");
const errors = [];
const warnings = [];
const records = [];
const validSlots = new Set(Object.keys(config.slots));
const validIntents = new Set(config.editorial.searchIntents);
const validTypes = new Set(config.editorial.contentTypes);
const allowedComponents = new Set(config.mdxComponents);
const today = todayInTimezone(config.timezone);

function fail(file, message) { errors.push(`${file}: ${message}`); }
function parseRunId(value) {
  const match = typeof value === "string" ? value.match(new RegExp(config.identity.automationRunIdPattern)) : null;
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (!isValidCalendarDate(date)) return null;
  const sequence = match[5] ? Number(match[5]) : 1;
  if (sequence < 1 || sequence > 99 || (sequence === 1 && match[5])) return null;
  return { date, slot: match[4], sequence };
}
function expectedRunId(date, slot, sequence) {
  return sequence === 1 ? `${date}-${slot}` : `${date}-${slot}-${String(sequence).padStart(2, "0")}`;
}
function countWords(content) {
  return content.replace(/```[\s\S]*?```/g, " ").replace(/<[^>]+>/gs, " ").replace(/https?:\/\/\S+/g, " ").match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

const categorySource = fs.readFileSync(path.join(root, "src", "config", "categories.ts"), "utf8");
const validCategories = new Set([...categorySource.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].map((m) => m[1]));
const rendererSource = fs.readFileSync(path.join(root, "src", "components", "mdx", "MdxContent.tsx"), "utf8");
const registered = parseRegisteredMdxComponents(rendererSource);
if (JSON.stringify(registered) !== JSON.stringify([...allowedComponents].sort())) errors.push("Configuração de componentes MDX diverge do renderer.");

for (const file of fs.readdirSync(articlesDir).filter((name) => name.endsWith(".mdx")).sort()) {
  const raw = fs.readFileSync(path.join(articlesDir, file), "utf8");
  let parsed;
  try { parsed = matter(raw); } catch (error) { fail(file, `frontmatter inválido (${error.message}).`); continue; }
  const { data, content } = parsed;
  const expectedSlug = file.replace(/\.mdx$/, "");
  if (data.slug !== expectedSlug) fail(file, `slug deve ser exatamente "${expectedSlug}".`);
  if (!validCategories.has(data.category)) fail(file, `categoria inválida: ${String(data.category)}.`);
  if (data.contentType !== undefined && !validTypes.has(data.contentType)) fail(file, `contentType inválido: ${String(data.contentType)}.`);
  for (const field of ["publishedAt", "updatedAt"]) if (data[field] !== undefined && !isValidCalendarDate(String(data[field]))) fail(file, `${field} inválido.`);
  if (isValidCalendarDate(String(data.publishedAt)) && isValidCalendarDate(String(data.updatedAt)) && compareIsoDates(String(data.updatedAt), String(data.publishedAt)) < 0) fail(file, "updatedAt anterior a publishedAt.");
  for (const component of extractUsedMdxComponents(content)) if (!allowedComponents.has(component)) fail(file, `componente MDX não registrado: <${component}>.`);
  const isAutomated = config.identity.automationFields.some((field) => data[field] !== undefined);
  const sourceUrls = [...new Set(extractSourceUrls(content))];
  let run = null;
  if (isAutomated) {
    for (const field of config.identity.automationFields) if (typeof data[field] !== "string" || !data[field].trim()) fail(file, `artigo automático exige ${field}.`);
    if (!validSlots.has(data.publicationSlot)) fail(file, "publicationSlot inválido.");
    if (!validIntents.has(data.searchIntent)) fail(file, "searchIntent inválido.");
    run = parseRunId(data.automationRunId);
    if (!run) fail(file, `automationRunId "${String(data.automationRunId)}" inválido.`);
    else {
      if (run.date !== data.publishedAt || run.slot !== data.publicationSlot) fail(file, "automationRunId deve combinar publishedAt e publicationSlot.");
      if (data.automationRunId !== expectedRunId(run.date, run.slot, run.sequence)) fail(file, "automationRunId não está na forma canônica.");
      if (compareIsoDates(run.date, today) > 0) fail(file, `publishedAt está no futuro em ${config.timezone}.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.topicKey ?? "")) fail(file, "topicKey inválido.");
    if (data.author !== config.identity.requiredAuthor) fail(file, `author automático deve ser ${config.identity.requiredAuthor}.`);
    if (data.status !== "published") fail(file, "artigo automático deve chegar como published.");
    if (!/<(?:Sources|SourceList)\b/.test(content)) fail(file, "artigo automático precisa de Sources ou SourceList.");
    const domains = new Set();
    for (const url of sourceUrls) { const result = classifySourceUrl(url); if (!result.ok) fail(file, `fonte rejeitada (${result.reason}): ${url}`); else domains.add(result.domain); }
    if (sourceUrls.filter((url) => url.startsWith("https://")).length < config.sources.minHttpsUrls) fail(file, "quantidade insuficiente de fontes HTTPS.");
    if (domains.size < config.sources.minRegistrableDomains) fail(file, "fontes precisam cobrir domínios registráveis distintos.");
    if (data.primarySourceUrl && !sourceUrls.includes(String(data.primarySourceUrl))) fail(file, "primarySourceUrl precisa aparecer nas fontes.");
    const floor = config.editorial.minimumWords[data.contentType] ?? config.editorial.defaultMinimumWords;
    if (countWords(content) < floor) fail(file, `conteúdo abaixo do mínimo de ${floor} palavras.`);
    if (/\b(revolucion[aá]rio|vai mudar tudo|garantido|sem nenhum risco|100% seguro)\b/i.test(content)) fail(file, "afirmação absoluta ou promocional proibida.");
  }
  records.push({ file, data, content, isAutomated, run });
}

for (const field of ["slug", "title", "automationRunId", "topicKey"]) {
  const seen = new Map();
  for (const record of records) {
    const value = field === "title" ? normalizeText(record.data[field]) : record.data[field];
    if (!value) continue;
    if (seen.has(value)) fail(record.file, `${field} duplica ${seen.get(value)}.`); else seen.set(value, record.file);
  }
}

const byDateSlot = new Map();
for (const record of records.filter((item) => item.isAutomated && item.data.status === "published" && item.run)) {
  const key = `${record.run.date}:${record.run.slot}`;
  const list = byDateSlot.get(key) ?? [];
  list.push(record);
  byDateSlot.set(key, list);
}
for (const [key, list] of byDateSlot) {
  if (list.length > config.limits.articlesPerSlot) errors.push(`${key}: mais de ${config.limits.articlesPerSlot} artigos no turno.`);
  const sequences = list.map((r) => r.run.sequence).sort((a, b) => a - b);
  for (let index = 0; index < sequences.length; index++) if (sequences[index] !== index + 1) errors.push(`${key}: sequência editorial possui lacuna; esperado ${index + 1}, encontrado ${sequences[index]}.`);
}
const byDate = new Map();
for (const record of records.filter((item) => item.isAutomated && item.data.status === "published")) {
  const list = byDate.get(record.data.publishedAt) ?? []; list.push(record); byDate.set(record.data.publishedAt, list);
}
for (const [date, list] of byDate) if (list.length > config.limits.articlesPerDate) errors.push(`${date}: mais de ${config.limits.articlesPerDate} artigos automáticos publicados.`);

const automated = records.filter((record) => record.isAutomated);
for (let i = 0; i < automated.length; i++) for (let j = i + 1; j < automated.length; j++) {
  const similarity = lexicalSimilarity(`${automated[i].data.title ?? ""} ${automated[i].data.description ?? ""}`, `${automated[j].data.title ?? ""} ${automated[j].data.description ?? ""}`, config.similarity.shingleSize);
  if (similarity >= config.similarity.blockThreshold) errors.push(`${automated[i].file} e ${automated[j].file}: similaridade lexical ${similarity.toFixed(2)} bloqueada.`);
  else if (similarity >= config.similarity.warnThreshold) warnings.push(`${automated[i].file} e ${automated[j].file}: similaridade lexical ${similarity.toFixed(2)} exige revisão editorial.`);
}

const branch = process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME || "";
if (branch.startsWith("automation/artigo-")) {
  const match = branch.match(/^automation\/artigo-(\d{4}-\d{2}-\d{2})-(manha|noite)(?:-([0-9]{2}))?-([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match || !isValidCalendarDate(match[1])) errors.push(`branch automática inválida: ${branch}.`);
  else {
    const slot = Object.entries(config.slots).find(([, value]) => value.branchToken === match[2])?.[0];
    const sequence = match[3] ? Number(match[3]) : 1;
    const runId = expectedRunId(match[1], slot, sequence);
    const matching = records.filter((record) => record.data.automationRunId === runId);
    if (matching.length !== 1) errors.push(`branch ${branch} precisa corresponder exatamente ao automationRunId ${runId}.`);
    else if (matching[0].data.slug !== match[4]) errors.push(`branch ${branch} e slug do artigo divergem.`);
  }
}

if (warnings.length) console.warn(`\nAvisos editoriais:\n${warnings.join("\n")}\n`);
if (errors.length) { console.error(`\nValidação editorial falhou (${errors.length} erro(s)):\n\n${errors.join("\n")}`); process.exit(1); }
console.log(`Conteúdo validado: ${records.length} artigo(s), ${automated.length} automático(s), com identidades sequenciais habilitadas.`);
