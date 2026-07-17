import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import sharp from "sharp";

/**
 * Helpers de fixture para os testes dos validadores.
 * Cada teste roda os scripts reais em um diretório temporário completo —
 * nunca alteramos artigos reais para simular falhas.
 */

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

export function createFixtureProject({ configOverrides = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pulsobyte-fixture-"));
  fs.mkdirSync(path.join(dir, "automation"), { recursive: true });
  fs.mkdirSync(path.join(dir, "content", "articles"), { recursive: true });
  fs.mkdirSync(path.join(dir, "public", "images", "articles"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src", "config"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src", "components", "mdx"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });

  const config = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "automation", "editorial-config.json"), "utf8")
  );
  deepMerge(config, configOverrides);
  fs.writeFileSync(
    path.join(dir, "automation", "editorial-config.json"),
    `${JSON.stringify(config, null, 2)}\n`
  );

  // Cópias reais: o fixture valida contra o mesmo renderer e categorias.
  fs.copyFileSync(
    path.join(repoRoot, "src", "components", "mdx", "MdxContent.tsx"),
    path.join(dir, "src", "components", "mdx", "MdxContent.tsx")
  );
  fs.copyFileSync(
    path.join(repoRoot, "src", "config", "categories.ts"),
    path.join(dir, "src", "config", "categories.ts")
  );

  // Os scripts leem node_modules do repo real via NODE_PATH.
  return { dir, config };
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value) && target[key]) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

export function cleanupFixture(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Gera um corpo de artigo com pelo menos `words` palavras visíveis. */
export function articleBody(words = 900) {
  const sentence =
    "Este parágrafo descreve um cenário técnico verificável com detalhes práticos e contexto suficiente para o leitor brasileiro entender a mudança. ";
  const perSentence = sentence.trim().split(" ").length;
  return sentence.repeat(Math.ceil(words / perSentence));
}

export function writeArticle(dir, slug, frontmatter, body) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  lines.push("---", "", body ?? articleBody());
  fs.writeFileSync(path.join(dir, "content", "articles", `${slug}.mdx`), lines.join("\n"));
}

export function automatedFrontmatter(slug, overrides = {}) {
  return {
    title: overrides.title ?? `Título automático de ${slug}`,
    description: overrides.description ?? `Descrição editorial exclusiva do artigo ${slug}.`,
    slug,
    category: "tecnologia",
    tags: ["tecnologia"],
    author: "Redação PulsoByte",
    publishedAt: "2026-07-17",
    updatedAt: "2026-07-17",
    status: "published",
    contentType: "news",
    featured: false,
    coverImage: `/images/articles/${slug}.webp`,
    coverImageAlt: "Descrição acessível",
    coverImageCaption: "Legenda da capa.",
    coverImageCredit: "Fotógrafo Exemplo",
    coverImageCreditUrl: "https://unsplash.com/photos/foto-exemplo-abc123",
    coverImageSource: "Unsplash",
    coverImageLicense: "Licença Unsplash",
    coverImageType: "photo",
    coverImagePosition: "50% 50%",
    seoTitle: `SEO de ${slug}`,
    seoDescription: `SEO descrição de ${slug}.`,
    publicationSlot: "morning",
    automationRunId: "2026-07-17-morning",
    topicKey: `topico-${slug}`,
    primaryEntity: `Entidade ${slug}`,
    searchIntent: "news",
    ...overrides,
  };
}

export function sourcesBlock(urls = ["https://www.wi-fi.org/discover-wi-fi/wi-fi-certified-7", "https://developers.google.com/search/docs"]) {
  const items = urls
    .map((url, index) => `    { label: "Fonte ${index + 1}", url: "${url}" },`)
    .join("\n");
  return `<Sources\n  items={[\n${items}\n  ]}\n/>\n`;
}

/** Capa WebP 16:9 com ruído aleatório (hash perceptual distinto por seed). */
export async function writeNoiseCover(dir, slug, { width = 1600, height = 900, seed = 1 } = {}) {
  // Ruído em baixa resolução ampliado: hash perceptual distinto por seed,
  // mas com peso pequeno (ruído puro em 1600x900 não comprime abaixo de 500 KB).
  const small = { width: 32, height: 18, channels: 3 };
  const raw = Buffer.alloc(small.width * small.height * small.channels);
  let state = seed;
  for (let i = 0; i < raw.length; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    raw[i] = state % 256;
  }
  await sharp(raw, { raw: small })
    .resize(width, height, { fit: "fill", kernel: "cubic" })
    .webp({ quality: 60 })
    .toFile(path.join(dir, "public", "images", "articles", `${slug}.webp`));
}

/** "WebP" falso: bytes PNG com extensão .webp. */
export async function writeFakeWebp(dir, slug) {
  const png = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(dir, "public", "images", "articles", `${slug}.webp`), png);
}

export async function writeCoverWithSize(dir, slug, width, height, seed = 7) {
  await writeNoiseCover(dir, slug, { width, height, seed });
}

/** Executa um script do repositório dentro do fixture. */
export function runScript(fixtureDir, script, { env = {}, args = [] } = {}) {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts", script), ...args],
    {
      cwd: fixtureDir,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_HEAD_REF: "",
        BRANCH_NAME: "",
        VALIDATE_SOURCE_AVAILABILITY: "",
        ...env,
      },
    }
  );
  return { code: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/**
 * Versão assíncrona de runScript: obrigatória quando o teste mantém um
 * servidor HTTP no MESMO processo (spawnSync bloquearia o event loop e o
 * script filho nunca receberia resposta).
 */
export function runScriptAsync(fixtureDir, script, { env = {}, args = [] } = {}) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.join(repoRoot, "scripts", script), ...args],
      {
        cwd: fixtureDir,
        env: {
          ...process.env,
          GITHUB_HEAD_REF: "",
          BRANCH_NAME: "",
          VALIDATE_SOURCE_AVAILABILITY: "",
          ...env,
        },
      }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export { repoRoot };
