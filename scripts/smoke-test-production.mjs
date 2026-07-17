import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { loadEditorialConfig } from "./lib/editorial.mjs";

/**
 * Smoke test da publicação em produção.
 *
 * Não aprova a página por "existir alguma tag": compara valores EXATOS —
 * canonical, og:url, og:image, JSON-LD (mainEntityOfPage, publisher, datas),
 * capa, sitemap e robots — contra o host canônico configurado e contra o
 * frontmatter real do artigo.
 *
 * Uso:
 *   node scripts/smoke-test-production.mjs --slug <slug> [--site https://host]
 *
 * --site cai para PRODUCTION_SITE e, por último, para
 * automation/editorial-config.json (site.productionUrl). HTTP simples é
 * aceito apenas para localhost/127.0.0.1 (testes automatizados).
 */

const config = loadEditorialConfig(process.cwd());

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const slug = argValue("--slug");
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Uso: node scripts/smoke-test-production.mjs --slug <slug> [--site https://host]");
  process.exit(2);
}

const rawSite = argValue("--site") || process.env.PRODUCTION_SITE || config.site.productionUrl;
let siteUrl;
try {
  siteUrl = new URL(rawSite);
} catch {
  console.error(`Site inválido: "${rawSite}".`);
  process.exit(2);
}
const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(siteUrl.hostname);
if (siteUrl.protocol !== "https:" && !isLocal) {
  console.error(`Site de produção precisa ser HTTPS: "${rawSite}".`);
  process.exit(2);
}
const site = siteUrl.origin;
const expectedHost = siteUrl.host;
const canonicalUrl = `${site}${config.site.articlePathPrefix}/${slug}`;

const articlePath = path.join(process.cwd(), "content", "articles", `${slug}.mdx`);
let expected = null;
if (fs.existsSync(articlePath)) {
  const { data } = matter(fs.readFileSync(articlePath, "utf8"));
  expected = {
    title: data.title,
    publishedAt: data.publishedAt,
    updatedAt: data.updatedAt,
    coverImage: data.coverImage,
  };
} else {
  console.warn(`Aviso: ${articlePath} não encontrado no checkout; validando sem comparar título/datas.`);
}

const errors = [];
const infos = [];

const RETRIES = 3;
const TIMEOUT_MS = 15000;

async function fetchWithRetry(url, { method = "GET" } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "PulsoByteSmokeTest/2.0" },
      });
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw new Error(`falha de rede após ${RETRIES} tentativa(s): ${lastError?.message}`);
}

/**
 * Extrai as tags de um HTML sem depender da ordem dos atributos.
 * Tokenizador simples e determinístico: encontra `<name ...>` e interpreta
 * atributos key="value" | key='value' | key=value | key.
 */
function parseTags(html, tagName) {
  const tags = [];
  const regex = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  for (const match of html.matchAll(regex)) {
    const attrs = {};
    const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|[^\s"'>]+))?/g;
    for (const attr of match[1].matchAll(attrRegex)) {
      const value = attr[3] ?? attr[4] ?? (attr[2] !== undefined ? attr[2] : "");
      attrs[attr[1].toLowerCase()] = value;
    }
    tags.push(attrs);
  }
  return tags;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (error) {
      errors.push(`JSON-LD inválido (não parseável): ${error.message}`);
    }
  }
  return blocks;
}

function decodeEntities(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}

// ---------------------------------------------------------------- página
let html = "";
try {
  const response = await fetchWithRetry(canonicalUrl);
  if (response.status !== 200) {
    errors.push(`página ${canonicalUrl} respondeu HTTP ${response.status} (esperado 200).`);
  }
  const finalUrl = new URL(response.url);
  if (finalUrl.host !== expectedHost) {
    errors.push(`página redirecionou para host inesperado: ${finalUrl.host} (esperado ${expectedHost}).`);
  }
  if (!finalUrl.pathname.endsWith(`/${slug}`)) {
    errors.push(`URL final não termina no slug esperado: ${finalUrl.pathname}.`);
  }
  html = await response.text();
} catch (error) {
  errors.push(`página do artigo: ${error.message}`);
}

if (html) {
  // título
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    errors.push("tag <title> não encontrada.");
  } else if (expected?.title && !decodeEntities(titleMatch[1]).includes(expected.title)) {
    errors.push(`<title> não contém o título esperado "${expected.title}" (encontrado: "${decodeEntities(titleMatch[1]).trim()}").`);
  }

  // canonical
  const canonicalTags = parseTags(html, "link").filter((tag) => tag.rel === "canonical");
  if (canonicalTags.length !== 1) {
    errors.push(`esperado exatamente 1 link canonical; encontrados ${canonicalTags.length}.`);
  } else if (canonicalTags[0].href !== canonicalUrl) {
    errors.push(`canonical incorreto: "${canonicalTags[0].href}" (esperado exatamente "${canonicalUrl}").`);
  }

  // og:url e og:image
  const metaTags = parseTags(html, "meta");
  const ogUrl = metaTags.find((tag) => tag.property === "og:url")?.content;
  if (ogUrl !== canonicalUrl) {
    errors.push(`og:url incorreto: "${ogUrl ?? "ausente"}" (esperado exatamente "${canonicalUrl}").`);
  }
  const ogImage = metaTags.find((tag) => tag.property === "og:image")?.content;
  if (!ogImage) {
    errors.push("og:image ausente.");
  } else {
    let ogImageUrl = null;
    try {
      ogImageUrl = new URL(ogImage);
    } catch {
      errors.push(`og:image não é URL absoluta: "${ogImage}".`);
    }
    if (ogImageUrl) {
      if (ogImageUrl.host !== expectedHost) {
        errors.push(`og:image em host inesperado: ${ogImageUrl.host} (esperado ${expectedHost}).`);
      }
      try {
        const imageResponse = await fetchWithRetry(ogImageUrl.href);
        if (imageResponse.status !== 200) {
          errors.push(`og:image respondeu HTTP ${imageResponse.status}: ${ogImageUrl.href}`);
        }
      } catch (error) {
        errors.push(`og:image inacessível: ${error.message}`);
      }
    }
  }

  // JSON-LD
  const blocks = extractJsonLdBlocks(html);
  const articleLd = blocks
    .flatMap((block) => (Array.isArray(block) ? block : [block]))
    .find((block) => block && (block["@type"] === "Article" || block["@type"] === "NewsArticle"));
  if (!articleLd) {
    errors.push("JSON-LD de Article/NewsArticle não encontrado.");
  } else {
    if (articleLd.mainEntityOfPage !== canonicalUrl) {
      errors.push(`JSON-LD mainEntityOfPage incorreto: "${articleLd.mainEntityOfPage}" (esperado "${canonicalUrl}").`);
    }
    if (articleLd.publisher?.name !== "PulsoByte") {
      errors.push(`JSON-LD publisher.name incorreto: "${articleLd.publisher?.name}".`);
    }
    if (articleLd.publisher?.url !== site) {
      errors.push(`JSON-LD publisher.url incorreto: "${articleLd.publisher?.url}" (esperado "${site}").`);
    }
    if (expected?.publishedAt && articleLd.datePublished !== expected.publishedAt) {
      errors.push(`JSON-LD datePublished "${articleLd.datePublished}" difere do frontmatter "${expected.publishedAt}".`);
    }
    if (expected?.updatedAt && articleLd.dateModified !== expected.updatedAt) {
      errors.push(`JSON-LD dateModified "${articleLd.dateModified}" difere do frontmatter "${expected.updatedAt}".`);
    }
    if (
      typeof articleLd.datePublished === "string" &&
      typeof articleLd.dateModified === "string" &&
      articleLd.dateModified < articleLd.datePublished
    ) {
      errors.push(`JSON-LD dateModified (${articleLd.dateModified}) anterior a datePublished (${articleLd.datePublished}).`);
    }
    if (typeof articleLd.image === "string" && expected?.coverImage) {
      const expectedCover = `${site}${expected.coverImage}`;
      if (articleLd.image !== expectedCover) {
        errors.push(`JSON-LD image "${articleLd.image}" difere da capa esperada "${expectedCover}".`);
      }
    }
  }
}

// ---------------------------------------------------------------- capa
const coverUrl = `${site}/images/articles/${slug}.webp`;
try {
  const response = await fetchWithRetry(coverUrl);
  if (response.status !== 200) {
    errors.push(`capa respondeu HTTP ${response.status}: ${coverUrl}`);
  } else {
    const mime = response.headers.get("content-type") ?? "";
    if (!/^image\/webp\b/.test(mime)) {
      errors.push(`MIME da capa não é image/webp: "${mime}".`);
    }
  }
} catch (error) {
  errors.push(`capa inacessível: ${error.message}`);
}

// ---------------------------------------------------------------- sitemap
try {
  const response = await fetchWithRetry(`${site}/sitemap.xml`);
  if (response.status !== 200) {
    errors.push(`sitemap respondeu HTTP ${response.status}.`);
  } else {
    const xml = await response.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeEntities(match[1].trim()));
    if (!locs.includes(canonicalUrl)) {
      const wrongHost = locs.find((loc) => loc.endsWith(`${config.site.articlePathPrefix}/${slug}`));
      if (wrongHost) {
        errors.push(`sitemap lista o artigo em host errado: "${wrongHost}" (esperado "${canonicalUrl}").`);
      } else {
        errors.push(`sitemap não contém a URL completa do artigo: "${canonicalUrl}".`);
      }
    }
  }
} catch (error) {
  errors.push(`sitemap inacessível: ${error.message}`);
}

// ---------------------------------------------------------------- robots
try {
  const response = await fetchWithRetry(`${site}/robots.txt`);
  if (response.status !== 200) {
    errors.push(`robots.txt respondeu HTTP ${response.status}.`);
  } else {
    const body = await response.text();
    const sitemapLine = body.split("\n").find((line) => /^sitemap:/i.test(line.trim()));
    const declared = sitemapLine?.replace(/^sitemap:\s*/i, "").trim();
    if (declared !== `${site}/sitemap.xml`) {
      errors.push(`robots.txt aponta o sitemap para "${declared ?? "nada"}" (esperado "${site}/sitemap.xml").`);
    }
  }
} catch (error) {
  errors.push(`robots.txt inacessível: ${error.message}`);
}

if (errors.length > 0) {
  console.error(`\nSmoke test de produção FALHOU para /${config.site.articlePathPrefix.replace(/^\//, "")}/${slug} em ${site} (${errors.length} erro(s)):\n\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

infos.push(`página, canonical, og:url, og:image, JSON-LD, capa, sitemap e robots verificados com valores exatos.`);
console.log(`Smoke test de produção aprovado para ${canonicalUrl}:\n- ${infos.join("\n- ")}`);
