#!/usr/bin/env node
/**
 * validate-article.mjs
 * ---------------------------------------------------------------------------
 * Valida o frontmatter de UM arquivo de artigo contra o schema declarado em
 * automation/config/pulsobyte.config.json -> "articleSchema".
 *
 * IMPORTANTE: este é um validador-guarda genérico. Se o projeto JÁ tem um
 * validador oficial (ex.: script "validate:content" no package.json, Zod, etc.),
 * PREFIRA-O. Este script existe para o caso de não haver, e para dar uma trava
 * mínima de campos obrigatórios/formatos. 🔍 CONFIRMAR NO REPO.
 *
 * articleSchema esperado (exemplo):
 * {
 *   "requiredFields": ["title","slug","date","author","category","tags",
 *                      "publicationSlot","automationRunId","topicKey",
 *                      "image","imageCredit","imageAlt"],
 *   "patterns": {
 *     "date": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
 *     "automationRunId": "^[0-9]{4}-[0-9]{2}-[0-9]{2}-(morning|evening)$",
 *     "publicationSlot": "^(morning|evening)$",
 *     "slug": "^[a-z0-9]+(-[a-z0-9]+)*$"
 *   },
 *   "allowedCategories": ["ia","apps","seguranca"]   // opcional
 * }
 *
 * Uso:
 *   node validate-article.mjs --file content/articles/meu-artigo.mdx
 *   node validate-article.mjs --file X.mdx --config caminho.json
 *
 * Código 0 = válido; 1 = inválido ou não pôde validar.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, existsSync } from "node:fs";

const DEFAULT_CONFIG = "automation/config/pulsobyte.config.json";

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

function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    val = val.trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      fm[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      fm[key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return fm;
}

function main() {
  const args = parseArgs(process.argv);
  const file = args.file;
  if (!file || !existsSync(file)) {
    console.error(JSON.stringify({ ok: false, error: `Arquivo não encontrado: ${file}` }, null, 2));
    process.exit(1);
  }

  const cfgPath = args.config || DEFAULT_CONFIG;
  if (!existsSync(cfgPath)) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: `Config de schema ausente: ${cfgPath}`,
          hint: "🔍 Crie articleSchema na config, ou use o validador oficial do projeto.",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const cfg = JSON.parse(readFileSync(cfgPath, "utf-8"));
  const schema = cfg.articleSchema || {};
  const required = schema.requiredFields || [];
  const patterns = schema.patterns || {};
  const allowedCategories = schema.allowedCategories || null;

  const raw = readFileSync(file, "utf-8");
  const fm = parseFrontmatter(raw);
  const errors = [];

  if (!fm) {
    errors.push("Frontmatter YAML não encontrado (bloco --- ... ---).");
  } else {
    for (const field of required) {
      const v = fm[field];
      const empty =
        v === undefined ||
        v === null ||
        v === "" ||
        (Array.isArray(v) && v.length === 0);
      if (empty) errors.push(`Campo obrigatório ausente/vazio: ${field}`);
    }
    for (const [field, pat] of Object.entries(patterns)) {
      if (fm[field] && typeof fm[field] === "string") {
        if (!new RegExp(pat).test(fm[field])) {
          errors.push(`Campo "${field}" não casa o padrão ${pat}: "${fm[field]}"`);
        }
      }
    }
    if (allowedCategories && fm.category && !allowedCategories.includes(fm.category)) {
      errors.push(
        `Categoria "${fm.category}" não permitida. Permitidas: ${allowedCategories.join(", ")}`
      );
    }
    // Data precisa existir no calendário (o pattern sozinho aceita 2026-07-99).
    if (fm.date && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fm.date)) {
      const [yy, mm, dd] = fm.date.split("-").map(Number);
      const probe = new Date(Date.UTC(yy, mm - 1, dd));
      if (
        probe.getUTCFullYear() !== yy ||
        probe.getUTCMonth() !== mm - 1 ||
        probe.getUTCDate() !== dd
      ) {
        errors.push(`Data inexistente no calendário: ${fm.date}`);
      }
    }

    // Coerência interna: se date e automationRunId existem, a data deve bater.
    if (fm.date && fm.automationRunId) {
      const runDate = fm.automationRunId.slice(0, 10);
      if (fm.date !== runDate) {
        errors.push(
          `Incoerência: date=${fm.date} difere da data em automationRunId=${fm.automationRunId}`
        );
      }
    }
    if (fm.publicationSlot && fm.automationRunId) {
      const runSlot = fm.automationRunId.split("-").pop();
      if (fm.publicationSlot !== runSlot) {
        errors.push(
          `Incoerência: publicationSlot=${fm.publicationSlot} difere do turno em automationRunId`
        );
      }
    }
  }

  if (errors.length) {
    console.error(JSON.stringify({ ok: false, file, errors }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, file, fields: Object.keys(fm) }, null, 2));
  process.exit(0);
}

main();
