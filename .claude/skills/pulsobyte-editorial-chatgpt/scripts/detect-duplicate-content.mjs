#!/usr/bin/env node
/**
 * detect-duplicate-content.mjs
 * ---------------------------------------------------------------------------
 * Checagem DETERMINÍSTICA de duplicidade exata contra o inventário.
 * (A duplicidade SEMÂNTICA — mesmo evento com outras palavras — é julgada pela
 *  IA seguindo references/topic-selection.md. Este script cobre o exato.)
 *
 * Compara os campos do tema candidato contra o inventário gerado por
 * inspect-editorial-inventory.mjs:
 *   - automationRunId idêntico
 *   - slug idêntico
 *   - topicKey idêntico
 *   - título normalizado idêntico
 *
 * Uso:
 *   node inspect-editorial-inventory.mjs --out /tmp/inv.json
 *   node detect-duplicate-content.mjs --inventory /tmp/inv.json \
 *        --slug meu-slug --topicKey minha-chave --title "Meu Título" \
 *        --runId 2026-07-18-morning
 *
 * Saída: JSON. Código 0 = sem colisão exata; 1 = colisão encontrada.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, existsSync } from "node:fs";

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

function normalizeTitle(t) {
  if (!t) return "";
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function main() {
  const args = parseArgs(process.argv);
  const invPath = args.inventory;

  if (!invPath || !existsSync(invPath)) {
    console.error(
      JSON.stringify(
        { ok: false, error: `Inventário não encontrado: ${invPath || "(vazio)"}` },
        null,
        2
      )
    );
    process.exit(1);
  }

  let inv;
  try {
    inv = JSON.parse(readFileSync(invPath, "utf-8"));
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
    process.exit(1);
  }

  const candidate = {
    slug: args.slug || null,
    topicKey: args.topicKey || null,
    titleNormalized: normalizeTitle(args.title),
    automationRunId: args.runId || null,
  };

  const collisions = [];
  for (const item of inv.items || []) {
    const reasons = [];
    if (candidate.automationRunId && item.automationRunId === candidate.automationRunId)
      reasons.push("automationRunId");
    if (candidate.slug && item.slug === candidate.slug) reasons.push("slug");
    if (candidate.topicKey && item.topicKey === candidate.topicKey) reasons.push("topicKey");
    if (
      candidate.titleNormalized &&
      item.titleNormalized === candidate.titleNormalized
    )
      reasons.push("titulo_normalizado");
    if (reasons.length) collisions.push({ path: item.path, reasons });
  }

  if (collisions.length) {
    console.error(
      JSON.stringify(
        { ok: false, duplicate: true, candidate, collisions },
        null,
        2
      )
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify({ ok: true, duplicate: false, candidate }, null, 2)
  );
  process.exit(0);
}

main();
