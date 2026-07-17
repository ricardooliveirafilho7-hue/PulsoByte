import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";
import {
  loadEditorialConfig,
  normalizeText,
  extractSourceUrls,
  classifySourceUrl,
} from "./lib/editorial.mjs";
import { sha256File, perceptualHash } from "./lib/images.mjs";

/**
 * Gera o manifesto editorial automation/editorial-catalog.json.
 *
 * O catálogo é a fonte de verdade do inventário editorial para o fallback
 * por conector (que não consegue listar a árvore inteira) e para as travas
 * de duplicidade do CI. Ele é SEMPRE gerado por este script — nunca editado
 * manualmente — e precisa ser determinístico: mesma árvore de conteúdo,
 * mesmos bytes.
 *
 * Uso:
 *   node scripts/generate-editorial-catalog.mjs           # (re)gera o arquivo
 *   node scripts/generate-editorial-catalog.mjs --check   # falha se o arquivo
 *                                                         # commitado divergir
 */

const root = process.cwd();
const config = loadEditorialConfig(root);
const articlesDir = path.join(root, "content", "articles");
const publicDir = path.join(root, "public");
const catalogPath = path.join(root, config.catalog.path);
const checkMode = process.argv.includes("--check");

function stringOrNull(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function collectInternalImages(content, coverImage) {
  const images = new Set();
  for (const match of content.matchAll(/!\[[^\]]*\]\((\/images\/articles\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    images.add(match[1]);
  }
  for (const match of content.matchAll(/\bsrc\s*=\s*["'](\/images\/articles\/[^"']+)["']/g)) {
    images.add(match[1]);
  }
  images.delete(coverImage);
  return [...images].sort();
}

async function buildCatalog() {
  const files = fs
    .readdirSync(articlesDir)
    .filter((name) => name.endsWith(".mdx"))
    .sort();

  const articles = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(articlesDir, file), "utf8");
    const { data, content } = matter(raw);
    const slug = stringOrNull(data.slug) ?? file.replace(/\.mdx$/, "");

    const sourceUrls = [...new Set(extractSourceUrls(content))].sort();
    const sourceDomains = [
      ...new Set(
        sourceUrls
          .map((url) => classifySourceUrl(url))
          .filter((result) => result.ok)
          .map((result) => result.domain)
      ),
    ].sort();

    const coverImage = stringOrNull(data.coverImage);
    let coverSha256 = null;
    let coverPerceptualHash = null;
    if (coverImage && coverImage.startsWith("/images/articles/")) {
      const coverPath = path.join(publicDir, coverImage.replace(/^\//, ""));
      if (fs.existsSync(coverPath)) {
        coverSha256 = sha256File(coverPath);
        try {
          coverPerceptualHash = await perceptualHash(coverPath, sharp);
        } catch {
          coverPerceptualHash = null;
        }
      }
    }

    const internalImages = [];
    for (const imageUrl of collectInternalImages(content, coverImage)) {
      const imagePath = path.join(publicDir, imageUrl.replace(/^\//, ""));
      internalImages.push({
        path: imageUrl,
        sha256: fs.existsSync(imagePath) ? sha256File(imagePath) : null,
      });
    }

    // Ordem fixa das chaves: a serialização precisa ser determinística.
    articles.push({
      slug,
      file: `content/articles/${file}`,
      status: stringOrNull(data.status),
      title: stringOrNull(data.title),
      normalizedTitle: normalizeText(data.title),
      publishedAt: stringOrNull(data.publishedAt),
      updatedAt: stringOrNull(data.updatedAt),
      category: stringOrNull(data.category),
      contentType: stringOrNull(data.contentType),
      publicationSlot: stringOrNull(data.publicationSlot),
      automationRunId: stringOrNull(data.automationRunId),
      topicKey: stringOrNull(data.topicKey),
      primaryEntity: stringOrNull(data.primaryEntity),
      normalizedPrimaryEntity: stringOrNull(data.primaryEntity) ? normalizeText(data.primaryEntity) : null,
      searchIntent: stringOrNull(data.searchIntent),
      primarySourceUrl: stringOrNull(data.primarySourceUrl),
      sourceUrls,
      sourceDomains,
      coverImage,
      coverSha256,
      coverPerceptualHash,
      internalImages,
    });
  }

  return {
    schemaVersion: config.catalog.schemaVersion,
    generatedBy: "scripts/generate-editorial-catalog.mjs",
    note: "Arquivo gerado automaticamente. NÃO edite manualmente: rode npm run catalog:generate.",
    articleCount: articles.length,
    articles,
  };
}

function serialize(catalog) {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

const catalog = await buildCatalog();
const nextContent = serialize(catalog);

if (checkMode) {
  if (!fs.existsSync(catalogPath)) {
    console.error(
      `Manifesto editorial ausente: ${config.catalog.path}. Gere com: npm run catalog:generate`
    );
    process.exit(1);
  }
  const current = fs.readFileSync(catalogPath, "utf8");
  if (current !== nextContent) {
    let detail = "conteúdo divergente";
    try {
      const parsed = JSON.parse(current);
      const currentSlugs = new Set((parsed.articles ?? []).map((a) => a.slug));
      const nextSlugs = new Set(catalog.articles.map((a) => a.slug));
      const missing = [...nextSlugs].filter((slug) => !currentSlugs.has(slug));
      const extra = [...currentSlugs].filter((slug) => !nextSlugs.has(slug));
      const changed = catalog.articles
        .filter((a) => currentSlugs.has(a.slug))
        .filter((a) => {
          const other = (parsed.articles ?? []).find((b) => b.slug === a.slug);
          return JSON.stringify(other) !== JSON.stringify(a);
        })
        .map((a) => a.slug);
      const parts = [];
      if (missing.length) parts.push(`registros ausentes: ${missing.join(", ")}`);
      if (extra.length) parts.push(`registros excedentes: ${extra.join(", ")}`);
      if (changed.length) parts.push(`registros desatualizados (hash, metadado ou serialização): ${changed.join(", ")}`);
      if (parts.length) detail = parts.join("; ");
    } catch {
      detail = "arquivo commitado não é JSON válido ou foi editado manualmente";
    }
    console.error(
      `Manifesto editorial desatualizado (${detail}).\nRegenere com: npm run catalog:generate`
    );
    process.exit(1);
  }
  console.log(
    `Manifesto editorial atualizado: ${catalog.articleCount} artigo(s), serialização determinística confirmada.`
  );
} else {
  fs.mkdirSync(path.dirname(catalogPath), { recursive: true });
  fs.writeFileSync(catalogPath, nextContent);
  console.log(`Manifesto editorial gerado em ${config.catalog.path} (${catalog.articleCount} artigo(s)).`);
}
