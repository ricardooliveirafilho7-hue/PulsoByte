import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import sharp from "sharp";

const root = process.cwd();
const articlesDir = path.join(root, "content", "articles");
const publicDir = path.join(root, "public");
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

function report(slug, field, problem, correction) {
  errors.push(`Erro no artigo "${slug}":\n${field}: ${problem}\nCorreção necessária: ${correction}`);
}

for (const fileName of fs.readdirSync(articlesDir).filter((name) => name.endsWith(".mdx"))) {
  const raw = fs.readFileSync(path.join(articlesDir, fileName), "utf8");
  const { data } = matter(raw);
  const slug = typeof data.slug === "string" ? data.slug : fileName.replace(/\.mdx$/, "");

  if (data.status !== "published") continue;

  for (const field of requiredFields) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      report(slug, field, "campo obrigatório ausente ou vazio.", "preencha o campo no frontmatter.");
    }
  }

  if (typeof data.coverImage !== "string" || data.coverImage.trim() === "") continue;

  if (/^https?:\/\//i.test(data.coverImage)) {
    report(slug, "coverImage", "URL externa não é permitida.", "baixe a imagem e use um caminho local em /images/articles/.");
    continue;
  }
  if (!data.coverImage.startsWith("/images/articles/")) {
    report(slug, "coverImage", "o caminho está fora de /images/articles/.", "mova a imagem para public/images/articles/.");
  }

  const expectedFile = `${slug}${path.extname(data.coverImage)}`;
  if (path.basename(data.coverImage) !== expectedFile) {
    report(slug, "coverImage", "o nome do arquivo não corresponde ao slug.", `renomeie a imagem para ${expectedFile}.`);
  }

  const imagePath = path.resolve(publicDir, data.coverImage.replace(/^\//, ""));
  const relativePath = path.relative(publicDir, imagePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    report(slug, "coverImage", "o caminho escapa da pasta public.", "use um caminho local seguro em /images/articles/.");
    continue;
  }
  if (!fs.existsSync(imagePath)) {
    report(slug, "coverImage", `arquivo ${data.coverImage} não encontrado.`, "adicione o arquivo local indicado no frontmatter.");
    continue;
  }

  if (path.extname(imagePath).toLowerCase() !== ".webp") {
    report(slug, "coverImage", "a extensão não é .webp.", "converta a capa para WebP.");
  }
  const size = fs.statSync(imagePath).size;
  if (size > 500 * 1024) {
    report(slug, "coverImage", `arquivo tem ${(size / 1024).toFixed(1)} KB.`, "comprima para no máximo 500 KB.");
  }

  const bytes = fs.readFileSync(imagePath);
  const digest = crypto.createHash("sha256").update(bytes).digest("hex");
  const previousHashSlug = usedHashes.get(digest);
  if (previousHashSlug) {
    report(slug, "coverImage", `bytes idênticos à capa de "${previousHashSlug}".`, "use uma capa editorial exclusiva.");
  } else {
    usedHashes.set(digest, slug);
  }

  try {
    const metadata = await sharp(imagePath).metadata();
    if (metadata.format !== "webp") {
      report(slug, "coverImage", `formato real detectado: ${metadata.format ?? "desconhecido"}.`, "gere WebP verdadeiro.");
    }
    if (!metadata.width || !metadata.height || metadata.width < 1200 || metadata.height < 675) {
      report(
        slug,
        "coverImage",
        `dimensão ${metadata.width ?? "?"}x${metadata.height ?? "?"} abaixo do mínimo 1200x675.`,
        "substitua por uma imagem com pelo menos 1200x675 px."
      );
    }
    if (metadata.width && metadata.height && metadata.width * 9 !== metadata.height * 16) {
      report(slug, "coverImage", `proporção ${metadata.width}x${metadata.height} não é 16:9.`, "recorte para 1600x900 ou outra dimensão 16:9 acima do mínimo.");
    }
    if ((metadata.pages ?? 1) > 1) {
      report(slug, "coverImage", "imagem animada não é permitida.", "gere um WebP estático.");
    }
    if (metadata.exif || metadata.iptc || metadata.xmp) {
      report(slug, "coverImage", "metadados incorporados desnecessários foram encontrados.", "remova EXIF/IPTC/XMP antes de publicar.");
    }

    const { data: pixels } = await sharp(imagePath)
      .rotate()
      .resize(8, 8, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const average = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
    const perceptual = [...pixels].map((value) => (value >= average ? "1" : "0")).join("");
    for (const previous of perceptualHashes) {
      const distance = [...perceptual].reduce(
        (total, bit, index) => total + (bit === previous.hash[index] ? 0 : 1),
        0
      );
      if (distance <= 5) {
        warnings.push(`Possível semelhança visual entre "${slug}" e "${previous.slug}" (distância ${distance}/64).`);
      }
    }
    perceptualHashes.push({ slug, hash: perceptual });
  } catch (error) {
    report(slug, "coverImage", `arquivo inválido ou ilegível (${error.message}).`, "gere novamente a imagem em WebP válido.");
  }

  const previousSlug = usedImages.get(data.coverImage);
  if (previousSlug) {
    report(slug, "coverImage", `a mesma capa já é usada por "${previousSlug}".`, "selecione uma imagem editorial específica para este artigo.");
  } else {
    usedImages.set(data.coverImage, slug);
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

console.log(`Imagens editoriais validadas: ${usedImages.size} artigo(s) publicado(s), hashes SHA-256 únicos.`);
