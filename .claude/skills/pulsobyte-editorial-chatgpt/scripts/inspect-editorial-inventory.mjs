#!/usr/bin/env node
/**
 * inspect-editorial-inventory.mjs
 * ---------------------------------------------------------------------------
 * Varre os artigos do projeto e produz um inventário pesquisável (JSON).
 *
 * NÃO presume o caminho dos artigos: lê de automation/config/pulsobyte.config.json
 * o campo "contentGlobs" (lista de globs). Se a config não existir ou não
 * apontar caminhos, o script AVISA e devolve inventário vazio em vez de chutar.
 * A instalação PulsoByte varre recursivamente os MDX em content/articles.
 *
 * Extrai frontmatter YAML simples (chave: valor e listas inline [a, b]).
 * Para schemas complexos, ajuste o parser ou aponte para o validador do projeto.
 *
 * Uso:
 *   node inspect-editorial-inventory.mjs
 *   node inspect-editorial-inventory.mjs --config caminho.json --out inventario.json
 *
 * Saída: JSON no stdout (e no --out, se dado). Código 0 sempre que roda;
 * usa o campo "warnings" para sinalizar problemas não fatais.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

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

function loadConfig(path) {
  if (!existsSync(path)) return { _missing: true };
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    return { _invalid: true, _error: e.message };
  }
}

/**
 * Expande um "glob" bem simples: só suporta um diretório-base + extensão.
 * Exemplo de glob aceito: content/articles seguido de wildcard recursivo e
 * uma extensão (".mdx"). Varre o diretório-base recursivamente pegando os
 * arquivos com aquela extensão. Mantido simples para não trazer dependências.
 */
function expandGlob(glob) {
  const files = [];

  // Caso 1: o glob não tem wildcard e aponta direto para um arquivo existente.
  if (!glob.includes("*") && existsSync(glob)) {
    try {
      if (statSync(glob).isFile()) {
        files.push(glob);
        return files;
      }
    } catch {
      return files;
    }
  }

  const extMatch = glob.match(/\*\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? "." + extMatch[1] : null;
  const base = glob.replace(/\*\*?.*$/, "").replace(/\/+$/, "");
  const startDir = base || ".";

  // Se a base não é um diretório, não há o que varrer.
  if (!existsSync(startDir)) return files;
  try {
    if (!statSync(startDir).isDirectory()) return files;
  } catch {
    return files;
  }

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full);
      else if (!ext || extname(full) === ext) files.push(full);
    }
  }
  walk(startDir);
  return files;
}

/** Parser de frontmatter minimalista (--- ... ---). */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
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
  const cfg = loadConfig(args.config || DEFAULT_CONFIG);
  const warnings = [];

  if (cfg._missing) {
    warnings.push(
      `Config não encontrada (${args.config || DEFAULT_CONFIG}). ` +
        `Defina contentGlobs; no PulsoByte o caminho é content/articles/**/*.mdx.`
    );
  } else if (cfg._invalid) {
    warnings.push(`Config inválida: ${cfg._error}`);
  }

  const globs = (cfg && cfg.contentGlobs) || [];
  if (!globs.length && !cfg._missing && !cfg._invalid) {
    warnings.push("contentGlobs vazio na config; esperado content/articles/**/*.mdx.");
  }

  const seen = new Set();
  const items = [];
  for (const g of globs) {
    for (const file of expandGlob(g)) {
      if (seen.has(file)) continue;
      seen.add(file);
      let raw;
      try {
        raw = readFileSync(file, "utf-8");
      } catch {
        continue;
      }
      const fm = parseFrontmatter(raw);
      items.push({
        path: file,
        title: fm.title || null,
        titleNormalized: normalizeTitle(fm.title),
        slug: fm.slug || null,
        date: fm.date || null,
        category: fm.category || null,
        tags: fm.tags || [],
        author: fm.author || null,
        publicationSlot: fm.publicationSlot || null,
        automationRunId: fm.automationRunId || null,
        topicKey: fm.topicKey || null,
        image: fm.image || null,
        imageCredit: fm.imageCredit || null,
      });
    }
  }

  const inventory = {
    ok: true,
    generatedAt: new Date().toISOString(),
    count: items.length,
    warnings,
    topicKeys: items.map((i) => i.topicKey).filter(Boolean),
    automationRunIds: items.map((i) => i.automationRunId).filter(Boolean),
    items,
  };

  const json = JSON.stringify(inventory, null, 2);
  console.log(json);
  if (args.out) writeFileSync(args.out, json);
  process.exit(0);
}

main();
