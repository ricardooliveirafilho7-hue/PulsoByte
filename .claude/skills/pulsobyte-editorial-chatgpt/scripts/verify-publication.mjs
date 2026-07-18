#!/usr/bin/env node
/**
 * verify-publication.mjs
 * ---------------------------------------------------------------------------
 * A trava mais importante do fluxo: confirma que o artigo REALMENTE publicou.
 * A existência de um deployment NÃO é publicação.
 *
 * Faz:
 *   1. Consulta a API da Vercel pelo commit SHA e espera readyState=READY.
 *   2. Abre a URL final do artigo e confirma HTTP 200.
 *   3. Confirma que o HTML contém o slug e (se dado) o título.
 *
 * Requer variáveis de ambiente:
 *   VERCEL_TOKEN       (token de leitura da Vercel)
 *   VERCEL_PROJECT_ID  (id do projeto)
 *   VERCEL_TEAM_ID     (opcional, se o projeto estiver num time)
 *
 * Uso:
 *   node verify-publication.mjs --sha <commitSHA> --url https://pulsobyte..../artigo \
 *        --slug meu-slug --title "Meu Título"
 *
 * Código 0 = publicação confirmada; 1 = não confirmada (NUNCA declarar publicado).
 * ---------------------------------------------------------------------------
 */

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = val;
    }
  }
  return args;
}

const MAX_TENTATIVAS = Number(process.env.VERIFY_MAX_TRIES || 12);
const INTERVALO_MS = Number(process.env.VERIFY_INTERVAL_MS || 15000);

function fail(obj) {
  console.error(JSON.stringify({ ok: false, ...obj }, null, 2));
  process.exit(1);
}

async function fetchDeploymentBySha(sha) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !projectId) {
    fail({ error: "VERCEL_TOKEN e VERCEL_PROJECT_ID são obrigatórios." });
  }
  const params = new URLSearchParams({ projectId, limit: "20" });
  if (teamId) params.set("teamId", teamId);
  const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const list = data.deployments || [];
  // Casa pelo SHA do commit (campo meta.githubCommitSha na maioria dos setups).
  return (
    list.find(
      (d) =>
        d?.meta?.githubCommitSha === sha ||
        d?.meta?.gitCommitSha === sha
    ) || null
  );
}

async function waitReady(sha) {
  for (let i = 0; i < MAX_TENTATIVAS; i++) {
    const dep = await fetchDeploymentBySha(sha);
    if (dep) {
      if (dep.readyState === "READY" || dep.state === "READY") return dep;
      if (dep.readyState === "ERROR" || dep.state === "ERROR") {
        throw new Error("Deployment terminou em ERROR.");
      }
    }
    await new Promise((r) => setTimeout(r, INTERVALO_MS));
  }
  throw new Error("Timeout esperando deployment READY para o SHA informado.");
}

async function confirmPage(url, slug, title) {
  const res = await fetch(url, { redirect: "follow" });
  if (res.status !== 200) {
    throw new Error(`Página retornou HTTP ${res.status}, esperado 200.`);
  }
  const html = await res.text();
  if (slug && !html.includes(slug)) {
    throw new Error("HTML não contém o slug esperado — possível página errada.");
  }
  if (title && !html.includes(title)) {
    // título pode ter escape de entidades; tratamos como aviso, não erro fatal
    return { titleMatched: false };
  }
  return { titleMatched: Boolean(title) };
}

async function main() {
  const args = parseArgs(process.argv);
  const sha = args.sha;
  const url = args.url;
  if (!sha || !url) {
    fail({ error: "Parâmetros --sha e --url são obrigatórios." });
  }

  let deployment;
  try {
    deployment = await waitReady(sha);
  } catch (e) {
    fail({ stage: "deployment", error: e.message, sha });
  }

  let pageCheck;
  try {
    pageCheck = await confirmPage(url, args.slug, args.title);
  } catch (e) {
    fail({ stage: "page", error: e.message, url });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        sha,
        url,
        deploymentUrl: deployment.url ? `https://${deployment.url}` : null,
        readyState: deployment.readyState || deployment.state,
        titleMatched: pageCheck.titleMatched,
        verifiedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  process.exit(0);
}

main();
