import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const articlesDir = path.join(root, "content", "articles");
const categorySource = fs.readFileSync(path.join(root, "src", "config", "categories.ts"), "utf8");
const validCategories = new Set(
  [...categorySource.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].map((match) => match[1])
);
const validContentTypes = new Set([
  "news", "explainer", "guide", "comparison", "analysis", "review", "visual-story", "opinion",
]);
const validSlots = new Set(["morning", "evening"]);
const validIntents = new Set(["informational", "practical", "comparison", "news", "safety"]);
const allowedComponents = new Set([
  "AdSlot",
  "BestFor",
  "Callout",
  "ComparisonTable",
  "ContextBox",
  "CorrectionNote",
  "Definition",
  "FAQ",
  "Figure",
  "FinalVerdict",
  "GuideChecklist",
  "KeyTakeaways",
  "ProsAndCons",
  "QuickSummary",
  "QuickVerdict",
  "Quote",
  "Requirements",
  "SourceList",
  "Sources",
  "StepByStep",
  "Timeline",
  "Troubleshooting",
  "UpdateHistory",
  "WhatChanged",
  "WhyItMatters",
]);
const minimumWords = {
  news: 800,
  guide: 1100,
  explainer: 1000,
  comparison: 1300,
  analysis: 1300,
  review: 1000,
  "visual-story": 900,
  opinion: 1000,
};
const automationFields = [
  "publicationSlot", "automationRunId", "topicKey", "primaryEntity", "searchIntent",
];
const records = [];
const errors = [];

function fail(file, problem) {
  errors.push(`${file}: ${problem}`);
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

  return visible.match(/[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
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

  for (const match of content.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
    if (!allowedComponents.has(match[1])) fail(file, `componente MDX não registrado: <${match[1]}>.`);
  }
  for (const match of content.matchAll(/\]\(\/artigos\/([a-z0-9-]+)(?:[?#][^)]*)?\)/g)) {
    const target = path.join(articlesDir, `${match[1]}.mdx`);
    if (!fs.existsSync(target)) fail(file, `link interno aponta para artigo inexistente: ${match[1]}.`);
  }

  const isAutomated = automationFields.some((field) => data[field] !== undefined);
  if (isAutomated) {
    for (const field of automationFields) {
      if (typeof data[field] !== "string" || data[field].trim() === "") {
        fail(file, `artigo automático exige ${field}.`);
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.publishedAt ?? "")) fail(file, "publishedAt deve usar AAAA-MM-DD.");
    if (!validSlots.has(data.publicationSlot)) fail(file, "publicationSlot deve ser morning ou evening.");
    if (!validIntents.has(data.searchIntent)) fail(file, "searchIntent inválido.");
    if (data.automationRunId !== `${data.publishedAt}-${data.publicationSlot}`) {
      fail(file, "automationRunId deve combinar publishedAt e publicationSlot.");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.topicKey ?? "")) {
      fail(file, "topicKey deve usar apenas minúsculas, números e hífens.");
    }
    if (data.author !== "Redação PulsoByte") fail(file, "author automático deve ser Redação PulsoByte.");
    if (data.status !== "published") fail(file, "artigo automático deve chegar ao PR como published.");
    if (!/<(?:Sources|SourceList)\b/.test(content)) {
      fail(file, "artigo automático precisa do componente Sources ou SourceList.");
    }
    const sourceUrls = [...content.matchAll(/\burl:\s*["'](https:\/\/[^"']+)["']/g)].map((match) => match[1]);
    if (new Set(sourceUrls).size < 2) {
      fail(file, "artigo automático precisa de pelo menos duas URLs HTTPS distintas nas fontes.");
    }
    const words = countVisibleWords(content);
    const floor = minimumWords[data.contentType] ?? 1000;
    if (words < floor) fail(file, `conteúdo automático tem ${words} palavras visíveis; mínimo para ${data.contentType ?? "o formato"}: ${floor}.`);
    if (/\b(revolucion[aá]rio|vai mudar tudo|garantido|sem nenhum risco|100% seguro)\b/i.test(content)) {
      fail(file, "afirmação absoluta ou promocional proibida encontrada.");
    }
  }

  records.push({ file, data, isAutomated });
}

for (const field of ["slug", "title", "automationRunId", "topicKey"]) {
  const seen = new Map();
  for (const record of records) {
    const value = field === "title" ? normalize(record.data[field]) : record.data[field];
    if (!value) continue;
    const previous = seen.get(value);
    if (previous) fail(record.file, `${field} duplica ${previous}.`);
    else seen.set(value, record.file);
  }
}

const perDate = new Map();
for (const record of records.filter((item) => item.isAutomated && item.data.status === "published")) {
  const date = record.data.publishedAt;
  const slots = perDate.get(date) ?? [];
  slots.push(record.data.publicationSlot);
  perDate.set(date, slots);
}
for (const [date, slots] of perDate) {
  if (slots.length > 2) errors.push(`${date}: mais de dois artigos automáticos publicados.`);
  for (const slot of validSlots) {
    if (slots.filter((value) => value === slot).length > 1) errors.push(`${date}: turno ${slot} duplicado.`);
  }
}

const branch = process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME || "";
const branchMatch = branch.match(/^automation\/artigo-(\d{4}-\d{2}-\d{2})-(manha|noite)-[a-z0-9-]+$/);
if (branch.startsWith("automation/artigo-") && !branchMatch) {
  errors.push(`branch automática inválida: ${branch}.`);
}
if (branchMatch) {
  const expectedSlot = branchMatch[2] === "manha" ? "morning" : "evening";
  const matching = records.filter(
    (record) => record.data.publishedAt === branchMatch[1] && record.data.publicationSlot === expectedSlot
  );
  if (matching.length !== 1) {
    errors.push(`branch ${branch} precisa corresponder a exatamente um artigo ${expectedSlot} de ${branchMatch[1]}.`);
  }
}

if (errors.length) {
  console.error(`\nValidação editorial falhou (${errors.length} erro(s)):\n\n${errors.join("\n")}`);
  process.exit(1);
}

console.log(`Conteúdo validado: ${records.length} artigo(s), ${records.filter((record) => record.isAutomated).length} automático(s).`);
