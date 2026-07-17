import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";
import { loadEditorialConfig } from "./lib/editorial.mjs";
import { sha256File, perceptualHash, hammingDistance } from "./lib/images.mjs";

/**
 * Validação editorial de imagens.
 *
 * Limites (peso, dimensões, proporção, distâncias perceptuais) vêm de
 * automation/editorial-config.json.
 *
 * Política de semelhança perceptual entre capas (aHash 8x8, 64 bits):
 * - distância ≤ perceptualDistanceBlock (${block}): em PR editorial
 *   automático (branch automation/artigo-*) é ERRO; fora dele, aviso;
 * - distância ≤ perceptualDistanceWarn: sempre aviso.
 * O acervo atual tem distância mínima 14/64 entre capas — os limites foram
 * escolhidos para nunca bloquear capas legítimas já publicadas.
 */

const root = process.cwd();
const config = loadEditorialConfig(root);
const articlesDir = path.join(root, "content", "articles");
const publicDir = path.join(root, "public");
const branch = process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME || "";
const strictPerceptual = branch.startsWith("automation/artigo-");

const validTypes = new Set([
  "photo",
  "official",
  "press",
  "screenshot",
  "diagram",
  "illustration",
  "original",
]);
const requiredFields = [
  "coverImage",
  "coverImageAlt",
  "coverImageCaption",
  "coverImageCredit",
  "coverImageCreditUrl",
  "coverImageSource",
  "coverImageLicense",
  "coverImageType",
  "coverImagePosition",
];

const errors = [];
const usedImages = new Map();
const usedHashes = new Map();
const perceptualHashes = [];
const warnings = [];
const validatedAssets = new Set();

function report(slug, field, problem, correction) {
  errors.push(`Erro no artigo "${slug}":\n${field}: ${problem}\nCorreção necessária: ${correction}`);
}

function resolvePublicImage(slug, field, imageUrl) {
  if (typeof imageUrl !== "string" || imageUrl.trim() === "") return null;
  if (/^https?:\/\//i.test(imageUrl)) {
    report(slug, field, "URL externa não é permitida.", "baixe a imagem e use um caminho local em /images/articles/.");
    return null;
  }
  if (!imageUrl.startsWith("/images/articles/")) {
    report(slug, field, "o caminho está fora de /images/articles/.", "mova a imagem para public/images/articles/.");
    return null;
  }

  const imagePath = path.resolve(publicDir, imageUrl.replace(/^\//, ""));
  const relativePath = path.relative(publicDir, imagePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    report(slug, field, "o caminho escapa da pasta public.", "use um caminho local seguro em /images/articles/.");
    return null;
  }
  if (!fs.existsSync(imagePath)) {
    report(slug, field, `arquivo ${imageUrl} não encontrado.`, "adicione o arquivo local indicado no artigo.");
    return null;
  }
  return imagePath;
}

async function validateImageAsset(slug, field, imageUrl, { cover = false } = {}) {
  const key = `${slug}:${imageUrl}:${cover ? "cover" : "internal"}`;
  if (validatedAssets.has(key)) return;
  validatedAssets.add(key);

  const imagePath = resolvePublicImage(slug, field, imageUrl);
  if (!imagePath) return;

  if (path.extname(imagePath).toLowerCase() !== ".webp") {
    report(slug, field, "a extensão não é .webp.", "converta a imagem para WebP.");
  }
  const size = fs.statSync(imagePath).size;
  if (size > config.images.maxBytes) {
    report(slug, field, `arquivo tem ${(size / 1024).toFixed(1)} KB.`, `comprima para no máximo ${Math.round(config.images.maxBytes / 1024)} KB.`);
  }

  const digest = sha256File(imagePath);
  const previousHash = usedHashes.get(digest);
  if (previousHash && previousHash.imageUrl !== imageUrl) {
    report(slug, field, `bytes idênticos à imagem ${previousHash.imageUrl} de "${previousHash.slug}".`, "use um arquivo editorial exclusivo ou reutilize exatamente o mesmo caminho quando isso for intencional.");
  } else if (!previousHash) {
    usedHashes.set(digest, { slug, imageUrl });
  }

  try {
    const metadata = await sharp(imagePath).metadata();
    if (metadata.format !== "webp") {
      report(slug, field, `formato real detectado: ${metadata.format ?? "desconhecido"}.`, "gere WebP verdadeiro.");
    }
    if (!metadata.width || !metadata.height) {
      report(slug, field, "dimensões não puderam ser identificadas.", "gere novamente a imagem em WebP válido.");
    }
    if (
      cover &&
      (!metadata.width || !metadata.height ||
        metadata.width < config.images.minWidth || metadata.height < config.images.minHeight)
    ) {
      report(slug, field, `dimensão ${metadata.width ?? "?"}x${metadata.height ?? "?"} abaixo do mínimo ${config.images.minWidth}x${config.images.minHeight}.`, `substitua por uma imagem com pelo menos ${config.images.minWidth}x${config.images.minHeight} px.`);
    }
    if (
      cover && metadata.width && metadata.height &&
      metadata.width * config.images.aspectHeight !== metadata.height * config.images.aspectWidth
    ) {
      report(slug, field, `proporção ${metadata.width}x${metadata.height} não é ${config.images.aspectWidth}:${config.images.aspectHeight}.`, "recorte para 1600x900 ou outra dimensão 16:9 acima do mínimo.");
    }
    if ((metadata.pages ?? 1) > 1) {
      report(slug, field, "imagem animada não é permitida.", "gere um WebP estático.");
    }
    if (metadata.exif || metadata.iptc || metadata.xmp) {
      report(slug, field, "metadados incorporados desnecessários foram encontrados.", "remova EXIF/IPTC/XMP antes de publicar.");
    }

    if (cover) {
      const perceptual = await perceptualHash(imagePath, sharp);
      for (const previous of perceptualHashes) {
        const distance = hammingDistance(perceptual, previous.hash);
        if (distance <= config.images.perceptualDistanceBlock) {
          if (strictPerceptual) {
            report(
              slug,
              field,
              `capa perceptualmente duplicada de "${previous.slug}" (distância ${distance}/${config.images.perceptualHashBits} ≤ ${config.images.perceptualDistanceBlock}).`,
              "escolha uma imagem visualmente distinta das capas já publicadas."
            );
          } else {
            warnings.push(`Semelhança perceptual forte entre "${slug}" e "${previous.slug}" (distância ${distance}/${config.images.perceptualHashBits}).`);
          }
        } else if (distance <= config.images.perceptualDistanceWarn) {
          warnings.push(`Possível semelhança visual entre "${slug}" e "${previous.slug}" (distância ${distance}/${config.images.perceptualHashBits}).`);
        }
      }
      perceptualHashes.push({ slug, hash: perceptual });
    }
  } catch (error) {
    report(slug, field, `arquivo inválido ou ilegível (${error.message}).`, "gere novamente a imagem em WebP válido.");
  }
}

function collectInternalImages(content) {
  const images = new Set();
  for (const match of content.matchAll(/!\[[^\]]*\]\((\/images\/articles\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    images.add(match[1]);
  }
  for (const match of content.matchAll(/\bsrc\s*=\s*["'](\/images\/articles\/[^"']+)["']/g)) {
    images.add(match[1]);
  }
  return images;
}

for (const fileName of fs.readdirSync(articlesDir).filter((name) => name.endsWith(".mdx")).sort()) {
  const raw = fs.readFileSync(path.join(articlesDir, fileName), "utf8");
  const { data, content } = matter(raw);
  const slug = typeof data.slug === "string" ? data.slug : fileName.replace(/\.mdx$/, "");

  if (data.status !== "published") continue;

  for (const field of requiredFields) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      report(slug, field, "campo obrigatório ausente ou vazio.", "preencha o campo no frontmatter.");
    }
  }

  if (typeof data.coverImage === "string" && data.coverImage.trim() !== "") {
    const expectedFile = `${slug}${path.extname(data.coverImage)}`;
    if (path.basename(data.coverImage) !== expectedFile) {
      report(slug, "coverImage", "o nome do arquivo não corresponde ao slug.", `renomeie a imagem para ${expectedFile}.`);
    }
    await validateImageAsset(slug, "coverImage", data.coverImage, { cover: true });

    const previousSlug = usedImages.get(data.coverImage);
    if (previousSlug) {
      report(slug, "coverImage", `a mesma capa já é usada por "${previousSlug}".`, "selecione uma imagem editorial específica para este artigo.");
    } else {
      usedImages.set(data.coverImage, slug);
    }
  }

  for (const internalImage of collectInternalImages(content)) {
    if (internalImage === data.coverImage) continue;
    await validateImageAsset(slug, `imagem interna ${internalImage}`, internalImage);
  }

  if (typeof data.coverImageType === "string" && !validTypes.has(data.coverImageType)) {
    report(slug, "coverImageType", `tipo "${data.coverImageType}" inválido.`, `use um destes valores: ${[...validTypes].join(", ")}.`);
  }
  if (typeof data.coverImageCreditUrl === "string") {
    try {
      const sourceUrl = new URL(data.coverImageCreditUrl);
      if (sourceUrl.protocol !== "https:") throw new Error("protocolo inseguro");
      if (sourceUrl.pathname === "/" || /\/(search|s)\/?$/i.test(sourceUrl.pathname)) {
        report(slug, "coverImageCreditUrl", "URL genérica ou de busca.", "use a página individual da imagem ou do press kit.");
      }
    } catch {
      report(slug, "coverImageCreditUrl", "URL HTTPS inválida.", "use a página original individual da imagem.");
    }
  }
  if (
    typeof data.coverImagePosition === "string" &&
    !/^(?:100|\d{1,2})% (?:100|\d{1,2})%$/.test(data.coverImagePosition)
  ) {
    report(slug, "coverImagePosition", "ponto focal inválido.", "use dois percentuais, por exemplo 50% 50%.");
  }
}

if (errors.length > 0) {
  console.error(`\nValidação editorial de imagens falhou (${errors.length} erro(s)):\n\n${errors.join("\n\n")}`);
  process.exit(1);
}

if (warnings.length > 0) console.warn(`\nAlertas de similaridade:\n${warnings.join("\n")}`);

console.log(`Imagens editoriais validadas: ${usedImages.size} artigo(s) publicado(s), ${validatedAssets.size} ativo(s) verificado(s), hashes SHA-256 únicos.`);
