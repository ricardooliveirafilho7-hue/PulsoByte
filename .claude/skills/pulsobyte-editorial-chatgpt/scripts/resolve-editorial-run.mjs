#!/usr/bin/env node
/** Resolve deterministicamente data, turno, sequência e branch editorial. */

import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  isValidCalendarDate,
  loadEditorialConfig,
} from "../../../../scripts/lib/editorial.mjs";

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const config = loadEditorialConfig(REPO_ROOT);
const timezone = config.timezone;
const slots = new Set(Object.keys(config.slots));
const runIdPattern = new RegExp(config.identity.automationRunIdPattern);

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

function dateInTimezone(forceDate) {
  if (forceDate) {
    if (!isValidCalendarDate(forceDate)) {
      throw new Error(`FORCE_DATE inválida: ${forceDate}`);
    }
    return forceDate;
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseSequence(raw) {
  if (raw === undefined || raw === "" || raw === "1" || raw === "01") return 1;
  if (!/^\d{1,2}$/.test(raw)) throw new Error(`Sequência inválida: ${raw}`);
  const sequence = Number(raw);
  if (sequence < 2 || sequence > config.limits.articlesPerSlot) {
    throw new Error(`Sequência deve estar entre 2 e ${config.limits.articlesPerSlot}: ${raw}`);
  }
  return sequence;
}

function slugify(input) {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .split("-")
    .slice(0, 5)
    .join("-");
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv);
  const slug = slugify(args.slug || process.env.EDITORIAL_SLUG);
  let date;
  let slot;
  let sequence;

  try {
    const suppliedRunId = args.runId || process.env.AUTOMATION_RUN_ID || "";
    if (suppliedRunId) {
      const match = suppliedRunId.match(runIdPattern);
      if (!match) throw new Error(`automationRunId inválido: "${suppliedRunId}"`);
      date = `${match[1]}-${match[2]}-${match[3]}`;
      slot = match[4];
      sequence = match[5] ? Number(match[5]) : 1;
      if (!isValidCalendarDate(date) || sequence === 1 && match[5]) {
        throw new Error(`automationRunId não canônico: "${suppliedRunId}"`);
      }
    } else {
      slot = args.slot || process.env.PUBLICATION_SLOT || "";
      if (!slots.has(slot)) throw new Error(`publicationSlot inválido: "${slot}"`);
      date = dateInTimezone(args.forceDate || process.env.FORCE_DATE || "");
      sequence = parseSequence(args.sequence || process.env.EDITORIAL_SEQUENCE);
    }
  } catch (error) {
    fail(error.message);
  }

  const sequenceSuffix = sequence === 1 ? "" : `-${String(sequence).padStart(2, "0")}`;
  const automationRunId = `${date}-${slot}${sequenceSuffix}`;
  const branchToken = config.slots[slot].branchToken;
  const branchPrefix = `automation/artigo-${date}-${branchToken}${sequenceSuffix}`;
  const branch = slug ? `${branchPrefix}-${slug}` : branchPrefix;

  const result = {
    ok: true,
    timezone,
    date,
    publicationSlot: slot,
    sequence,
    automationRunId,
    branchToken,
    slug: slug || null,
    branchPrefix,
    branch,
    resolvedAt: new Date().toISOString(),
  };
  console.log(JSON.stringify(result, null, 2));

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      [
        `date=${date}`,
        `publication_slot=${slot}`,
        `sequence=${sequence}`,
        `automation_run_id=${automationRunId}`,
        `branch_prefix=${branchPrefix}`,
        `branch=${branch}`,
      ].join("\n") + "\n"
    );
  }
}

main();
