#!/usr/bin/env node
/** Valida a capa de um artigo individual segundo o schema real do PulsoByte. */

import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const REPO_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const DEFAULT_CONFIG = join(REPO_ROOT, "automation", "config", "pulsobyte.config.json");

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

async function readDimensions(path) {
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(path).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const file = args.file ? resolve(args.file) : null;
  const warnings = [];
  const errors = [];

  if (!file || !existsSync(file)) {
    console.error(JSON.stringify({ ok: false, error: `Artigo não encontrado: ${args.file}` }, null, 2));
    process.exit(1);
  }

  const configPath = args.config ? resolve(args.config) : DEFAULT_CONFIG;
  if (!existsSync(configPath)) {
    console.error(JSON.stringify({ ok: false, error: `Config não encontrada: ${configPath}` }, null, 2));
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const policy = config.imagePolicy ?? {};
  const publicDir = resolve(REPO_ROOT, policy.publicDir ?? "public");
  const allowedExt = policy.allowedExt ?? [".webp"];
  const maxBytes = policy.maxBytes ?? 512000;
  const minWidth = policy.minWidth ?? 1200;
  const minHeight = policy.minHeight ?? 675;

  let frontmatter;
  try {
    frontmatter = matter(readFileSync(file, "utf8")).data;
  } catch (error) {
    errors.push(`Frontmatter YAML inválido: ${error.message}`);
  }

  if (frontmatter) {
    for (const field of ["coverImage", "coverImageAlt", "coverImageCredit"]) {
      if (typeof frontmatter[field] !== "string" || !frontmatter[field].trim()) {
        errors.push(`Campo ${field} ausente ou vazio.`);
      }
    }

    if (typeof frontmatter.coverImage === "string" && frontmatter.coverImage.trim()) {
      const relativePath = frontmatter.coverImage.replace(/^\/+/, "");
      const absolutePath = join(publicDir, relativePath.replace(/^public[\\/]/, ""));
      const extension = extname(frontmatter.coverImage).toLowerCase();

      if (!frontmatter.coverImage.startsWith("/images/articles/")) {
        errors.push("coverImage deve apontar para /images/articles/.");
      }
      if (!allowedExt.includes(extension)) {
        errors.push(`Extensão não permitida: ${extension}. Permitidas: ${allowedExt.join(", ")}`);
      }
      if (!existsSync(absolutePath)) {
        errors.push(`Arquivo de capa não existe: ${absolutePath}`);
      } else {
        const size = statSync(absolutePath).size;
        if (size > maxBytes) {
          errors.push(`Imagem pesada: ${size} bytes > máximo ${maxBytes}.`);
        }
        const dimensions = await readDimensions(absolutePath);
        if (!dimensions) {
          warnings.push("sharp indisponível: checagem de dimensões pulada.");
        } else {
          if (dimensions.width < minWidth) {
            errors.push(`Largura ${dimensions.width} < mínimo ${minWidth}.`);
          }
          if (dimensions.height < minHeight) {
            errors.push(`Altura ${dimensions.height} < mínimo ${minHeight}.`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(JSON.stringify({ ok: false, file, errors, warnings }, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify({ ok: true, file, coverImage: frontmatter.coverImage, warnings }, null, 2)
  );
}

main();
