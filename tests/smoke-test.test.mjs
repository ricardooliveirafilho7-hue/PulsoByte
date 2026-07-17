import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  createFixtureProject,
  cleanupFixture,
  writeArticle,
  automatedFrontmatter,
  articleBody,
  sourcesBlock,
  runScriptAsync,
} from "./helpers/fixtures.mjs";

/**
 * Testes do smoke test de produção contra um servidor HTTP local que serve
 * páginas artesanais — provamos que valores incorretos são de fato
 * bloqueados, não apenas que "existe alguma tag".
 */

const SLUG = "artigo-de-producao";

function buildPage(site, { canonical, ogUrl, mainEntity, publisherUrl, sitemapHost } = {}) {
  const canonicalHref = canonical ?? `${site}/artigos/${SLUG}`;
  const ogUrlValue = ogUrl ?? `${site}/artigos/${SLUG}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: `Título automático de ${SLUG}`,
    image: `${site}/images/articles/${SLUG}.webp`,
    datePublished: "2026-07-17",
    dateModified: "2026-07-17",
    mainEntityOfPage: mainEntity ?? `${site}/artigos/${SLUG}`,
    publisher: { "@type": "Organization", name: "PulsoByte", url: publisherUrl ?? site },
  };
  return {
    html: `<!doctype html><html><head>
      <title>Título automático de ${SLUG} | PulsoByte</title>
      <link rel="canonical" href="${canonicalHref}"/>
      <meta property="og:url" content="${ogUrlValue}"/>
      <meta property="og:image" content="${site}/images/articles/${SLUG}.webp"/>
      <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
      </head><body><h1>ok</h1></body></html>`,
    sitemap: `<?xml version="1.0" encoding="UTF-8"?><urlset><url><loc>${sitemapHost ?? site}/artigos/${SLUG}</loc></url></urlset>`,
    robots: `User-Agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
  };
}

async function startServer(configure) {
  const cover = await sharp({
    create: { width: 1600, height: 900, channels: 3, background: { r: 40, g: 80, b: 120 } },
  })
    .webp()
    .toBuffer();

  const server = http.createServer((request, response) => {
    const site = `http://127.0.0.1:${server.address().port}`;
    const page = buildPage(site, configure ? configure(site) : {});
    if (request.url === `/artigos/${SLUG}`) {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(page.html);
    } else if (request.url === `/images/articles/${SLUG}.webp`) {
      response.writeHead(200, { "content-type": "image/webp" });
      response.end(cover);
    } else if (request.url === "/sitemap.xml") {
      response.writeHead(200, { "content-type": "application/xml" });
      response.end(page.sitemap);
    } else if (request.url === "/robots.txt") {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end(page.robots);
    } else {
      response.writeHead(404).end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, site: `http://127.0.0.1:${server.address().port}` };
}

function fixtureWithArticle() {
  const fixture = createFixtureProject();
  writeArticle(
    fixture.dir,
    SLUG,
    automatedFrontmatter(SLUG),
    `${articleBody(850)}\n\n${sourcesBlock()}`
  );
  return fixture;
}

async function runSmoke(configure) {
  const { server, site } = await startServer(configure);
  const { dir } = fixtureWithArticle();
  try {
    return await runScriptAsync(dir, "smoke-test-production.mjs", { args: ["--slug", SLUG, "--site", site] });
  } finally {
    server.close();
    cleanupFixture(dir);
  }
}

test("smoke test aprova página correta com valores exatos", async () => {
  const result = await runSmoke();
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /valores exatos/);
});

test("smoke test bloqueia canonical incorreto", async () => {
  const result = await runSmoke(() => ({ canonical: "https://www.pulsobyte.com.br/artigos/" + SLUG }));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /canonical incorreto/);
});

test("smoke test bloqueia og:url incorreto", async () => {
  const result = await runSmoke((site) => ({ ogUrl: `${site}/artigos/outro-slug` }));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /og:url incorreto/);
});

test("smoke test bloqueia JSON-LD com mainEntityOfPage errado", async () => {
  const result = await runSmoke(() => ({ mainEntity: "https://outra-origem.example/artigos/" + SLUG }));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /mainEntityOfPage incorreto/);
});

test("smoke test bloqueia publisher com URL de outro host", async () => {
  const result = await runSmoke(() => ({ publisherUrl: "https://www.pulsobyte.com.br" }));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /publisher\.url incorreto/);
});

test("smoke test bloqueia sitemap apontando para host errado", async () => {
  const result = await runSmoke(() => ({ sitemapHost: "https://www.pulsobyte.com.br" }));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /host errado/);
});

test("smoke test falha com página inexistente (404)", async () => {
  const { server, site } = await startServer();
  const { dir } = fixtureWithArticle();
  try {
    fs.renameSync(
      path.join(dir, "content", "articles", `${SLUG}.mdx`),
      path.join(dir, "content", "articles", "outro-nome.mdx")
    );
    const result = await runScriptAsync(dir, "smoke-test-production.mjs", {
      args: ["--slug", "slug-que-nao-existe", "--site", site],
    });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /HTTP 404/);
  } finally {
    server.close();
    cleanupFixture(dir);
  }
});
