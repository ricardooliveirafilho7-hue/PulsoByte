#!/usr/bin/env node
/**
 * validate-run-identity.mjs
 * ---------------------------------------------------------------------------
 * Valida um automationRunId e impede que o MESMO turno rode duas vezes.
 *
 * Regras de formato:
 *   - Deve casar ^[0-9]{4}-[0-9]{2}-[0-9]{2}-(morning|evening)$
 *   - Proibidos sufixos/sequenciais: -02, -03, -retry, -new, -final, -revised,
 *     -second e variações. (Qualquer coisa após o turno reprova, pois a regex
 *     é ancorada em $.)
 *
 * Trava de duplicidade:
 *   - Lê automation/state/execucoes.jsonl (se existir).
 *   - Se já houver um registro com o mesmo automationRunId cujo status NÃO seja
 *     "falhou_validacao" nem "bloqueado_turno_ja_executado", considera o turno
 *     já ocupado e reprova (a não ser que --mode resume seja passado).
 *
 * Uso:
 *   node validate-run-identity.mjs --runId 2026-07-18-morning
 *   node validate-run-identity.mjs --runId 2026-07-18-morning --mode resume
 *   node validate-run-identity.mjs --runId 2026-07-18-morning --state caminho.jsonl
 *
 * Saída: JSON no stdout. Código 0 = ok para prosseguir; 1 = bloqueado/inválido.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, existsSync } from "node:fs";

const RUN_ID_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-(morning|evening)$/;
const DEFAULT_STATE = "automation/state/execucoes.jsonl";

// Status que NÃO ocupam o turno (permitem nova tentativa do mesmo runId).
const NON_BLOCKING = new Set(["falhou_validacao", "bloqueado_turno_ja_executado"]);

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

function readState(path) {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf-8").trim();
  if (!raw) return [];
  const records = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      records.push(JSON.parse(t));
    } catch {
      // Linha corrompida não deve derrubar a validação; registra e segue.
      records.push({ _corrupt: true, raw: t });
    }
  }
  return records;
}

function main() {
  const args = parseArgs(process.argv);
  const runId = args.runId || process.env.AUTOMATION_RUN_ID || "";
  const mode = args.mode || process.env.EDITORIAL_MODE || "editorial";
  const statePath = args.state || DEFAULT_STATE;

  if (!RUN_ID_RE.test(runId)) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: `automationRunId inválido: "${runId}"`,
          expected: "^[0-9]{4}-[0-9]{2}-[0-9]{2}-(morning|evening)$",
          hint: "Sem sufixos como -02, -retry, -final, -new, -revised, -second.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const records = readState(statePath).filter((r) => !r._corrupt);
  const sameRun = records.filter((r) => r.automationRunId === runId);
  const occupying = sameRun.filter((r) => !NON_BLOCKING.has(r.status));

  const alreadyOccupied = occupying.length > 0;
  const isResume = mode === "resume";

  if (alreadyOccupied && !isResume) {
    const last = occupying[occupying.length - 1];
    console.error(
      JSON.stringify(
        {
          ok: false,
          blocked: true,
          reason: "turno_ja_executado",
          automationRunId: runId,
          lastKnownStatus: last.status || null,
          lastKnownStage: last.etapa_atual || last.stage || null,
          hint: "Use mode=resume para continuar a mesma execução, nunca criar outra.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const result = {
    ok: true,
    automationRunId: runId,
    mode,
    priorRecords: sameRun.length,
    resuming: alreadyOccupied && isResume,
    lastKnownStage:
      sameRun.length > 0
        ? sameRun[sameRun.length - 1].etapa_atual ||
          sameRun[sameRun.length - 1].stage ||
          null
        : null,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main();
