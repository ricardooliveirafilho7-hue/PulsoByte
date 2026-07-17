import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  loadEditorialConfig,
  parseAutomationBranch,
  parseAutomationRunId,
  validateEditorialScope,
  findRunConflicts,
} from "../lib/editorial.mjs";

/**
 * Defesa própria do workflow para PRs editoriais automáticos
 * (branch automation/artigo-*), independente do agente que abriu o PR.
 *
 * Etapas (todas fail-closed):
 *   --scope        allowlist do diff BASE_SHA..HEAD_SHA;
 *   --identity     branch ↔ frontmatter ↔ automationRunId coerentes;
 *   --concurrency  duplicidade contra a branch padrão (via catálogo na base),
 *                  PRs abertos e branches remotas, consultados pela API.
 *
 * Ambiente esperado (fornecido pelo GitHub Actions):
 *   BASE_SHA, HEAD_SHA, HEAD_BRANCH, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN.
 *
 * A mensagem de falha sempre nomeia o objeto concorrente ou o arquivo fora
 * da allowlist.
 */

const config = loadEditorialConfig(process.cwd());
const steps = new Set(process.argv.slice(2));
if (steps.size === 0) {
  steps.add("--scope").add("--identity").add("--concurrency");
}

const {
  BASE_SHA,
  HEAD_SHA,
  HEAD_BRANCH,
  PR_NUMBER,
  GITHUB_REPOSITORY,
  GH_TOKEN,
  GITHUB_TOKEN,
} = process.env;
const token = GH_TOKEN || GITHUB_TOKEN;

function die(message) {
  console.error(`BLOQUEADO: ${message}`);
  process.exit(1);
}

if (!BASE_SHA || !HEAD_SHA || !HEAD_BRANCH) {
  die("BASE_SHA, HEAD_SHA e HEAD_BRANCH são obrigatórios.");
}

const parsedBranch = parseAutomationBranch(HEAD_BRANCH, config);
if (!parsedBranch) {
  die(`branch editorial inválida (padrão ${config.identity.branchPattern}): ${HEAD_BRANCH}`);
}

function gitDiffChanges() {
  const output = execFileSync(
    "git",
    ["diff", "--name-status", `${BASE_SHA}..${HEAD_SHA}`],
    { encoding: "utf8" }
  );
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split("\t");
      return { status: status[0], file: rest[rest.length - 1] };
    });
}

async function api(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${pathname} respondeu HTTP ${response.status}.`);
  }
  return response.json();
}

let articlePath = null;

if (steps.has("--scope")) {
  const changes = gitDiffChanges();
  const result = validateEditorialScope(changes, config);
  if (!result.ok) {
    die(`escopo do PR fora da allowlist editorial:\n- ${result.errors.join("\n- ")}`);
  }
  articlePath = result.article;
  console.log(
    `Escopo aprovado: ${result.article}, capa ${result.cover}, ${result.internalImages.length} imagem(ns) interna(s), manifesto atualizado.`
  );
}

if (!articlePath) {
  articlePath = `content/articles/${parsedBranch.slug}.mdx`;
}

let frontmatter = null;
if (fs.existsSync(path.join(process.cwd(), articlePath))) {
  frontmatter = matter(fs.readFileSync(path.join(process.cwd(), articlePath), "utf8")).data;
} else {
  die(`artigo esperado não encontrado no checkout: ${articlePath}`);
}

const runId = String(frontmatter.automationRunId ?? "");
const parsedRunId = parseAutomationRunId(runId, config);

if (steps.has("--identity")) {
  if (!parsedRunId) {
    die(`automationRunId inválido no frontmatter: "${runId}".`);
  }
  if (parsedRunId.date !== parsedBranch.date || parsedRunId.slot !== parsedBranch.slot) {
    die(
      `identidade divergente: branch indica ${parsedBranch.date}/${parsedBranch.slot}, frontmatter indica ${parsedRunId.date}/${parsedRunId.slot}.`
    );
  }
  if (String(frontmatter.slug) !== parsedBranch.slug) {
    die(`slug do frontmatter ("${frontmatter.slug}") difere do slug da branch ("${parsedBranch.slug}").`);
  }
  console.log(`Identidade aprovada: ${runId} (${HEAD_BRANCH}).`);
}

if (steps.has("--concurrency")) {
  if (!token || !GITHUB_REPOSITORY) {
    die("GH_TOKEN e GITHUB_REPOSITORY são obrigatórios para a checagem de concorrência.");
  }
  if (!parsedRunId) die(`automationRunId inválido: "${runId}".`);

  // Catálogo na BASE: inventário de artigos já integrados na branch padrão.
  let catalogArticles = [];
  try {
    const baseCatalogRaw = execFileSync(
      "git",
      ["show", `${BASE_SHA}:${config.catalog.path}`],
      { encoding: "utf8" }
    );
    catalogArticles = JSON.parse(baseCatalogRaw).articles ?? [];
  } catch {
    console.warn(
      `Aviso: catálogo ${config.catalog.path} não existe na base ${BASE_SHA.slice(0, 7)}; usando inventário vazio.`
    );
  }

  const prs = await api(`/repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100`);
  const openPrs = prs.map((pr) => ({ number: pr.number, headRef: pr.head?.ref ?? "" }));

  const branchData = await api(`/repos/${GITHUB_REPOSITORY}/branches?per_page=100`);
  const branches = branchData.map((item) => item.name);

  const conflicts = findRunConflicts(
    {
      runId,
      date: parsedRunId.date,
      slot: parsedRunId.slot,
      topicKey: typeof frontmatter.topicKey === "string" ? frontmatter.topicKey : null,
      prNumber: PR_NUMBER ? Number(PR_NUMBER) : undefined,
      headBranch: HEAD_BRANCH,
      catalogArticles,
      openPrs,
      branches,
    },
    config
  );

  if (conflicts.length > 0) {
    die(`concorrência/duplicidade detectada:\n- ${conflicts.join("\n- ")}`);
  }
  console.log(
    `Concorrência aprovada: nenhum artigo integrado, PR aberto ou branch disputa ${runId}.`
  );
}
