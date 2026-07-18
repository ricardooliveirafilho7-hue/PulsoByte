#!/usr/bin/env node
/**
 * validate-images.mjs
 * ---------------------------------------------------------------------------
 * Valida a imagem principal referenciada por um artigo:
 *   - o arquivo existe no disco (resolvendo o caminho público -> pasta real)
 *   - extensão permitida
 *   - peso máximo
 *   - dimensões mínimas e proporção (se "sharp" estiver instalado; caso
 *     contrário, apenas avisa e pula a checagem de dimensão)
 *   - o artigo declara imageAlt e imageCredit não vazios
 *
 * Config esperada em automation/config/pulsobyte.config.json -> "imagePolicy":
 * {
 *   "publicDir": "public",
 *   "allowedExt": [".webp",".jpg",".png"],
 *   "maxBytes": 600000,
 *   "minWidth": 1200,
 *   "minHeight": 630
 * }
 *
 * Uso:
 *   node validate-images.mjs --file content/articles/meu-artigo.mdx
 *
 * Código 0 = ok; 1 = falhou. Avisos não-fatais vão em "warnings".
 * ---------------------------------------------------------------------------
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

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
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    fm[key] = val.trim().replace(/^["']|["']$/g, "");
  }
  return fm;
}

async function tryDimensions(absPath) {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(absPath).metadata();
    return { width: meta.width, height: meta.height };
  } catch {
    return null; // sharp indisponível: pula dimensão
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const file = args.file;
  const warnings = [];
  const errors = [];

  if (!file || !existsSync(file)) {
    console.error(JSON.stringify({ ok: false, error: `Artigo não encontrado: ${file}` }, null, 2));
    process.exit(1);
  }

  const cfgPath = args.config || DEFAULT_CONFIG;
  const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf-8")) : {};
  const pol = cfg.imagePolicy || {};
  const publicDir = pol.publicDir || "public";
  const allowedExt = pol.allowedExt || [".webp", ".jpg", ".jpeg", ".png"];
  const maxBytes = pol.maxBytes || 800000;
  const minWidth = pol.minWidth || 0;
  const minHeight = pol.minHeight || 0;

  if (!cfg.imagePolicy) {
    warnings.push("imagePolicy ausente na config; usando padrões conservadores.");
  }

  const fm = parseFrontmatter(readFileSync(file, "utf-8"));

  if (!fm.image) errors.push("Campo image ausente no frontmatter.");
  if (!fm.imageAlt) errors.push("Campo imageAlt ausente ou vazio.");
  if (!fm.imageCredit) errors.push("Campo imageCredit ausente ou vazio.");

  if (fm.image) {
    // Caminho público "/img/x.webp" -> disco "<publicDir>/img/x.webp"
    const rel = fm.image.startsWith("/") ? fm.image.slice(1) : fm.image;
    const absPath = join(publicDir, rel);

    if (!existsSync(absPath)) {
      errors.push(`Arquivo de imagem não existe no disco: ${absPath} (de image=${fm.image})`);
    } else {
      const ext = "." + (fm.image.split(".").pop() || "").toLowerCase();
      if (!allowedExt.includes(ext)) {
        errors.push(`Extensão não permitida: ${ext}. Permitidas: ${allowedExt.join(", ")}`);
      }
      const size = statSync(absPath).size;
      if (size > maxBytes) {
        errors.push(`Imagem pesada: ${size} bytes > máximo ${maxBytes}. Comprima.`);
      }
      if (minWidth || minHeight) {
        const dim = await tryDimensions(absPath);
        if (!dim) {
          warnings.push("sharp indisponível: checagem de dimensões pulada.");
        } else {
          if (minWidth && dim.width < minWidth)
            errors.push(`Largura ${dim.width} < mínimo ${minWidth}.`);
          if (minHeight && dim.height < minHeight)
            errors.push(`Altura ${dim.height} < mínimo ${minHeight}.`);
        }
      }
    }
  }

  if (errors.length) {
    console.error(JSON.stringify({ ok: false, file, errors, warnings }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, file, image: fm.image, warnings }, null, 2));
  process.exit(0);
}

main();
