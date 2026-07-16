import fs from "node:fs";
import path from "node:path";
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
  "coverImageCredit",
  "coverImageSource",
  "coverImageType",
  "coverImagePosition",
];

const errors = [];
const usedImages = new Map();

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

  try {
    const metadata = await sharp(imagePath).metadata();
    if (!metadata.width || !metadata.height || metadata.width < 1200 || metadata.height < 675) {
      report(
        slug,
        "coverImage",
        `dimensão ${metadata.width ?? "?"}x${metadata.height ?? "?"} abaixo do mínimo 1200x675.`,
        "substitua por uma imagem com pelo menos 1200x675 px."
      );
    }
  } catch (error) {
    report(slug, "coverImage", `arquivo inválido ou ilegível (${error.message}).`, "gere novamente a imagem em WebP, AVIF, PNG ou JPEG válido.");
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

console.log(`Imagens editoriais validadas: ${usedImages.size} artigo(s) publicado(s).`);
