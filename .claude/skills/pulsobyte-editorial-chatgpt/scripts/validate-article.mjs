#!/usr/bin/env node
/**
 * Valida o frontmatter de um artigo contra
 * automation/config/pulsobyte.config.json.
 *
 * O YAML é interpretado por gray-matter, a mesma dependência usada pelo
 * validador oficial do projeto. Datas civis e automationRunId reutilizam as
 * funções canônicas de scripts/lib/editorial.mjs.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import {
  compareIsoDates,
  isValidCalendarDate,
  loadEditorialConfig,
  parseAutomationRunId,
} from "../../../../scripts/lib/editorial.mjs";

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

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function main() {
  const args = parseArgs(process.argv);
  const file = args.file;
  if (!file || !existsSync(file)) {
    console.error(JSON.stringify({ ok: false, error: `Arquivo não encontrado: ${file}` }, null, 2));
    process.exit(1);
  }

  const configPath = args.config
    ? resolve(args.config)
    : DEFAULT_CONFIG;
  if (!existsSync(configPath)) {
    console.error(
      JSON.stringify(
        { ok: false, error: `Config de schema ausente: ${configPath}` },
        null,
        2
      )
    );
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const canonicalConfig = loadEditorialConfig(REPO_ROOT);
  const schema = config.articleSchema ?? {};
  const errors = [];

  let frontmatter;
  try {
    frontmatter = matter(readFileSync(file, "utf8")).data;
  } catch (error) {
    errors.push(`Frontmatter YAML inválido: ${error.message}`);
  }

  if (frontmatter) {
    const automationFields = schema.automationFields ?? canonicalConfig.identity.automationFields;
    const isAutomated = automationFields.some((field) => frontmatter[field] !== undefined);
    const requiredFields = [
      ...(schema.requiredFields ?? []),
      ...(isAutomated ? schema.automatedRequiredFields ?? automationFields : []),
    ];

    for (const field of new Set(requiredFields)) {
      if (isEmpty(frontmatter[field])) {
        errors.push(`Campo obrigatório ausente/vazio: ${field}`);
      }
    }

    for (const [field, pattern] of Object.entries(schema.patterns ?? {})) {
      const value = frontmatter[field];
      if (value !== undefined && typeof value === "string" && !new RegExp(pattern).test(value)) {
        errors.push(`Campo "${field}" não casa o padrão ${pattern}: "${value}"`);
      }
    }

    if (
      Array.isArray(schema.allowedCategories) &&
      frontmatter.category &&
      !schema.allowedCategories.includes(frontmatter.category)
    ) {
      errors.push(
        `Categoria "${frontmatter.category}" não permitida. Permitidas: ${schema.allowedCategories.join(", ")}`
      );
    }

    for (const field of ["publishedAt", "updatedAt"]) {
      if (!isEmpty(frontmatter[field]) && !isValidCalendarDate(frontmatter[field])) {
        errors.push(`${field} deve ser uma data civil válida em YYYY-MM-DD: ${String(frontmatter[field])}`);
      }
    }

    if (
      isValidCalendarDate(frontmatter.publishedAt) &&
      isValidCalendarDate(frontmatter.updatedAt) &&
      compareIsoDates(frontmatter.updatedAt, frontmatter.publishedAt) < 0
    ) {
      errors.push("updatedAt não pode ser anterior a publishedAt.");
    }

    if (frontmatter.automationRunId) {
      const run = parseAutomationRunId(frontmatter.automationRunId, canonicalConfig);
      const sequenceMatch = frontmatter.automationRunId.match(/-(\d{2})$/);
      const hasInvalidSequence = sequenceMatch && Number(sequenceMatch[1]) < 2;
      if (!run || hasInvalidSequence) {
        errors.push(`automationRunId inválido: ${frontmatter.automationRunId}`);
      } else {
        if (run.date !== frontmatter.publishedAt) {
          errors.push(
            `automationRunId usa a data ${run.date}, diferente de publishedAt=${frontmatter.publishedAt}`
          );
        }
        if (run.slot !== frontmatter.publicationSlot) {
          errors.push(
            `automationRunId usa o turno ${run.slot}, diferente de publicationSlot=${frontmatter.publicationSlot}`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(JSON.stringify({ ok: false, file, errors }, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify({ ok: true, file, fields: Object.keys(frontmatter) }, null, 2)
  );
}

main();
