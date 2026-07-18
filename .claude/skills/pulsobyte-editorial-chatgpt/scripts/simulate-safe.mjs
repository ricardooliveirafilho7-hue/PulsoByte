#!/usr/bin/env node
/**
 * simulate-safe.mjs
 * ---------------------------------------------------------------------------
 * Simulação SEGURA: exercita a infraestrutura da skill SEM produzir artigo,
 * baixar imagem, criar branch remota, commitar ou abrir PR.
 *
 * Testa: resolução de execução, validação de identidade, leitura da config,
 * inventário (com a config atual), e geração de um nome de branch fictício.
 *
 * Uso: node simulate-safe.mjs --slot morning
 * ---------------------------------------------------------------------------
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

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

function run(script, extra = []) {
  const path = join(SCRIPT_DIR, script);
  if (!existsSync(path)) return { script, ok: false, error: "script ausente" };
  try {
    const out = execFileSync("node", [path, ...extra], {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    return { script, ok: true, output: JSON.parse(out) };
  } catch (e) {
    let parsed = null;
    try { parsed = JSON.parse(e.stdout || e.stderr || "{}"); } catch {}
    return { script, ok: false, output: parsed, raw: (e.stderr || "").slice(0, 400) };
  }
}

const args = parseArgs(process.argv);
const slot = args.slot || "morning";
const forceDate = args.forceDate || "2099-01-01"; // data claramente de teste

console.log("=== SIMULAÇÃO SEGURA (nenhum conteúdo será produzido) ===\n");

const steps = [];

// 1. resolver execução (com data de teste forçada)
process.env.FORCE_DATE = forceDate;
steps.push(run("resolve-editorial-run.mjs", ["--slot", slot, "--slug", "teste-simulacao"]));

const runId = steps[0].output?.automationRunId || `${forceDate}-${slot}`;

// 2. validar identidade (turno de teste — não deve estar ocupado)
steps.push(run("validate-run-identity.mjs", ["--runId", runId]));

// 3. inventário (usa a config atual; pode vir vazio se contentGlobs não setado)
const inventoryPath = join(tmpdir(), "pulsobyte-inv-sim.json");
steps.push(run("inspect-editorial-inventory.mjs", ["--out", inventoryPath]));

// 4. detecção de duplicata (candidato fictício vs inventário)
steps.push(run("detect-duplicate-content.mjs", [
  "--inventory", inventoryPath,
  "--slug", "artigo-teste-simulacao-xyz",
  "--topicKey", "teste-simulacao-entidade-evento-2099",
  "--title", "Título Fictício de Teste de Simulação",
  "--runId", runId,
]));

let allOk = true;
for (const s of steps) {
  const status = s.ok ? "OK " : "FALHA";
  if (!s.ok) allOk = false;
  console.log(`[${status}] ${s.script}`);
  if (!s.ok && s.output) console.log("        motivo:", JSON.stringify(s.output).slice(0, 200));
}

console.log("\n=== Branch fictícia gerada:", steps[0].output?.branch || "(n/a)");
console.log("=== Resultado geral:", allOk ? "INFRAESTRUTURA OK" : "REVISAR ITENS ACIMA");
console.log("\nObs.: inventário/duplicata podem 'avisar' se contentGlobs ainda não");
console.log("aponta para artigos reais — isso é esperado antes de configurar o repo.");

process.exit(allOk ? 0 : 1);
