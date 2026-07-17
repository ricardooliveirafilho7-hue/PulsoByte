import { loadEditorialConfig, parseAutomationRunId, parseAutomationBranch, classifyRunState } from "../lib/editorial.mjs";

/**
 * Classifica o estado de uma execução editorial (automationRunId) e imprime
 * a única ação segura de retomada. Usado pelo agente editorial e pela futura
 * automação guardiã antes de criar QUALQUER objeto novo (pauta, branch,
 * commit ou PR) — ver docs/automation-editorial.md, seção "Retomada".
 *
 * Uso:
 *   GH_TOKEN=... GITHUB_REPOSITORY=owner/repo \
 *     node scripts/automation/run-state.mjs 2026-07-18-morning
 *
 * Saída: JSON { runId, state, action, detail, evidence } em stdout.
 * A lógica de classificação é pura (classifyRunState) e coberta por testes.
 */

const config = loadEditorialConfig(process.cwd());
const runId = process.argv[2];
const parsed = runId ? parseAutomationRunId(runId, config) : null;
if (!parsed) {
  console.error(`Uso: node scripts/automation/run-state.mjs <automationRunId válido> (recebido: ${runId ?? "nada"}).`);
  process.exit(2);
}

const { GITHUB_REPOSITORY } = process.env;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token || !GITHUB_REPOSITORY) {
  console.error("GH_TOKEN e GITHUB_REPOSITORY são obrigatórios.");
  process.exit(2);
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
  if (!response.ok) throw new Error(`GitHub API ${pathname} → HTTP ${response.status}`);
  return response.json();
}

const evidence = {};

// 1. Artigo já integrado? Catálogo da branch padrão é a fonte de inventário.
const repo = await api(`/repos/${GITHUB_REPOSITORY}`);
const defaultBranch = repo.default_branch;
evidence.defaultBranch = defaultBranch;

let integratedArticle = null;
try {
  const contents = await api(
    `/repos/${GITHUB_REPOSITORY}/contents/${config.catalog.path}?ref=${encodeURIComponent(defaultBranch)}`
  );
  const catalog = JSON.parse(Buffer.from(contents.content, "base64").toString("utf8"));
  integratedArticle = (catalog.articles ?? []).find((a) => a.automationRunId === runId) ?? null;
  if (integratedArticle) evidence.integratedArticle = integratedArticle.file;
} catch {
  evidence.catalog = "indisponível na branch padrão";
}

// 2. PR aberto e branch do turno.
const pulls = await api(`/repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100`);
let openPr = null;
let ciStatus = null;
for (const pr of pulls) {
  const branchInfo = parseAutomationBranch(pr.head?.ref ?? "", config);
  if (branchInfo && branchInfo.date === parsed.date && branchInfo.slot === parsed.slot) {
    openPr = pr.number;
    evidence.openPr = `#${pr.number} (${pr.head.ref})`;
    const checks = await api(`/repos/${GITHUB_REPOSITORY}/commits/${pr.head.sha}/check-runs`);
    const states = (checks.check_runs ?? []).map((run) =>
      run.status !== "completed" ? "pending" : run.conclusion
    );
    if (states.some((s) => ["failure", "timed_out", "cancelled", "action_required"].includes(s))) {
      ciStatus = "failure";
    } else if (states.length > 0 && states.every((s) => ["success", "neutral", "skipped"].includes(s))) {
      ciStatus = "success";
    } else {
      ciStatus = states.length === 0 ? null : "pending";
    }
    evidence.ciStatus = ciStatus ?? "sem checks";
    break;
  }
}

let branchExists = false;
let branchStaleHours = 0;
if (!openPr) {
  const branches = await api(`/repos/${GITHUB_REPOSITORY}/branches?per_page=100`);
  for (const item of branches) {
    const branchInfo = parseAutomationBranch(item.name, config);
    if (branchInfo && branchInfo.date === parsed.date && branchInfo.slot === parsed.slot) {
      branchExists = true;
      evidence.branch = item.name;
      try {
        const commit = await api(`/repos/${GITHUB_REPOSITORY}/commits/${item.commit.sha}`);
        const committedAt = new Date(commit.commit.committer.date).getTime();
        branchStaleHours = (Date.now() - committedAt) / 3_600_000;
        evidence.branchStaleHours = Math.round(branchStaleHours);
      } catch {
        branchStaleHours = 0;
      }
      break;
    }
  }
}

// 3. Produção verificada: por ora, sinalizada quando o artigo integrado está
// published e o deploy é responsabilidade do smoke test; o chamador pode
// confirmar com scripts/smoke-test-production.mjs (action "verify").
const result = classifyRunState({
  integratedArticle,
  productionVerified: false,
  openPr,
  ciStatus,
  branchExists,
  branchStaleHours,
  blockedMarker: null,
});

console.log(JSON.stringify({ runId, ...result, evidence }, null, 2));
