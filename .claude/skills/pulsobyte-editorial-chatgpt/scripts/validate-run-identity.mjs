#!/usr/bin/env node
/** Valida uma identidade editorial sem criar ou consumir estado. */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  isValidCalendarDate,
  loadEditorialConfig,
} from "../../../../scripts/lib/editorial.mjs";

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const config = loadEditorialConfig(REPO_ROOT);
const runIdPattern = new RegExp(config.identity.automationRunIdPattern);
const DEFAULT_STATE = "automation/state/execucoes.jsonl";
const NON_BLOCKING = new Set(["falhou_validacao", "bloqueado_turno_ja_executado"]);

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index++) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;
    const key = argument.slice(2);
    args[key] =
      argv[index + 1] && !argv[index + 1].startsWith("--")
        ? argv[++index]
        : "true";
  }
  return args;
}

function readState(path) {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

function parseRunId(runId) {
  const match = runId.match(runIdPattern);
  if (!match) return null;
  const sequence = match[5] ? Number(match[5]) : 1;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (!isValidCalendarDate(date) || (sequence === 1 && match[5])) return null;
  return {
    date,
    slot: match[4],
    sequence,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const runId = args.runId || process.env.AUTOMATION_RUN_ID || "";
  const mode = args.mode || process.env.EDITORIAL_MODE || "editorial";
  const statePath = args.state || DEFAULT_STATE;
  const parsed = parseRunId(runId);

  if (!parsed) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: `automationRunId inválido ou não canônico: "${runId}"`,
          expected: config.identity.automationRunIdPattern,
          hint: "A primeira execução não usa sufixo; as seguintes usam -02 até -99.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const sameRun = readState(statePath).filter((record) => record.automationRunId === runId);
  const occupying = sameRun.filter((record) => !NON_BLOCKING.has(record.status));
  const alreadyOccupied = occupying.length > 0;
  const isResume = mode === "resume";

  if (alreadyOccupied && !isResume) {
    const last = occupying.at(-1);
    console.error(
      JSON.stringify(
        {
          ok: false,
          blocked: true,
          reason: "automation_run_id_ja_consumido",
          automationRunId: runId,
          lastKnownStatus: last.status ?? null,
          lastKnownStage: last.etapa_atual ?? last.stage ?? null,
          hint: "Retome a mesma branch e o mesmo PR; nunca crie objetos novos para este automationRunId.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        automationRunId: runId,
        ...parsed,
        mode,
        priorRecords: sameRun.length,
        resuming: alreadyOccupied && isResume,
      },
      null,
      2
    )
  );
}

main();
