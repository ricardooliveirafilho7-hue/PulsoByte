#!/usr/bin/env node
/**
 * resolve-editorial-run.mjs
 * ---------------------------------------------------------------------------
 * Resolve, de forma DETERMINÍSTICA, a identidade de um turno editorial:
 *   - data em America/Sao_Paulo (AAAA-MM-DD)
 *   - turno (morning | evening)
 *   - automationRunId (AAAA-MM-DD-<turno>)
 *   - prefixo de branch
 *
 * Uso:
 *   node resolve-editorial-run.mjs --slot morning
 *   node resolve-editorial-run.mjs --slot evening --slug openai-novo-recurso
 *   node resolve-editorial-run.mjs --runId 2026-07-18-morning
 *
 * Variáveis de ambiente aceitas (equivalentes às flags):
 *   PUBLICATION_SLOT, AUTOMATION_RUN_ID, EDITORIAL_SLUG, FORCE_DATE (só p/ teste)
 *
 * Saída: JSON no stdout. Em GitHub Actions, também escreve em $GITHUB_OUTPUT.
 * Sai com código 0 se resolveu, 1 se entrada inválida.
 * ---------------------------------------------------------------------------
 */

import { appendFileSync } from "node:fs";

const TZ = "America/Sao_Paulo";
const SLOTS = new Set(["morning", "evening"]);
const RUN_ID_RE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})-(morning|evening)$/;

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

/** Data atual (ou FORCE_DATE) formatada em America/Sao_Paulo como AAAA-MM-DD. */
function dateInSaoPaulo(forceDate) {
  if (forceDate) {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(forceDate)) {
      throw new Error(`FORCE_DATE inválida: ${forceDate}`);
    }
    return forceDate;
  }
  // en-CA formata como AAAA-MM-DD, respeitando o timeZone.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function slugify(input) {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .split("-")
    .slice(0, 5) // curto: no máx. ~5 termos
    .join("-");
}

function fail(msg) {
  console.error(JSON.stringify({ ok: false, error: msg }, null, 2));
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv);

  const slug = slugify(args.slug || process.env.EDITORIAL_SLUG || "");
  const forceDate = args.forceDate || process.env.FORCE_DATE || "";

  let date;
  let slot;

  const runIdInput = args.runId || process.env.AUTOMATION_RUN_ID || "";

  if (runIdInput) {
    // Caminho: runId fornecido -> extrair data e turno dele.
    const m = RUN_ID_RE.exec(runIdInput);
    if (!m) {
      fail(
        `automationRunId inválido: "${runIdInput}". ` +
          `Esperado ^[0-9]{4}-[0-9]{2}-[0-9]{2}-(morning|evening)$`
      );
    }
    date = `${m[1]}-${m[2]}-${m[3]}`;
    slot = m[4];
  } else {
    // Caminho: slot fornecido -> data vem de America/Sao_Paulo.
    slot = args.slot || process.env.PUBLICATION_SLOT || "";
    if (!SLOTS.has(slot)) {
      fail(`publicationSlot inválido: "${slot}". Use morning ou evening.`);
    }
    try {
      date = dateInSaoPaulo(forceDate);
    } catch (e) {
      fail(e.message);
    }
  }

  // Validação de data real (evita 2026-13-40 etc.)
  const [y, mo, d] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== mo - 1 ||
    probe.getUTCDate() !== d
  ) {
    fail(`Data inexistente no calendário: ${date}`);
  }

  const automationRunId = `${date}-${slot}`;
  const slotPt = slot === "morning" ? "manha" : "noite";
  const branchPrefix = `automation/artigo-${date}-${slotPt}`;
  const branch = slug ? `${branchPrefix}-${slug}` : branchPrefix;

  const result = {
    ok: true,
    timezone: TZ,
    date,
    publicationSlot: slot,
    automationRunId,
    slotPt,
    slug: slug || null,
    branchPrefix,
    branch,
    resolvedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(result, null, 2));

  // Exporta para o GitHub Actions, se aplicável.
  if (process.env.GITHUB_OUTPUT) {
    const out = [
      `date=${date}`,
      `publication_slot=${slot}`,
      `automation_run_id=${automationRunId}`,
      `branch_prefix=${branchPrefix}`,
      `branch=${branch}`,
    ].join("\n");
    appendFileSync(process.env.GITHUB_OUTPUT, out + "\n");
  }

  process.exit(0);
}

main();
