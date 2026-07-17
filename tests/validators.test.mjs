import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createFixtureProject,
  cleanupFixture,
  writeArticle,
  automatedFrontmatter,
  articleBody,
  sourcesBlock,
  writeNoiseCover,
  writeFakeWebp,
  writeCoverWithSize,
  runScript,
} from "./helpers/fixtures.mjs";

/**
 * Testes de integração dos validadores reais, executados em projetos de
 * fixture temporários. Nenhum artigo real é alterado para simular falhas.
 */

async function validAutomatedFixture(overrides = {}) {
  const fixture = createFixtureProject(overrides.configOverrides ? { configOverrides: overrides.configOverrides } : {});
  const slug = overrides.slug ?? "artigo-automatico-teste";
  writeArticle(
    fixture.dir,
    slug,
    automatedFrontmatter(slug, overrides.frontmatter ?? {}),
    `${articleBody(850)}\n\n${sourcesBlock()}`
  );
  await writeNoiseCover(fixture.dir, slug, { seed: overrides.seed ?? 11 });
  return { ...fixture, slug };
}

test("artigo automático válido passa em conteúdo e imagens", async () => {
  const { dir } = await validAutomatedFixture();
  try {
    const content = runScript(dir, "validate-article-content.mjs");
    assert.equal(content.code, 0, content.stderr);
    const images = runScript(dir, "validate-article-images.mjs");
    assert.equal(images.code, 0, images.stderr);
  } finally {
    cleanupFixture(dir);
  }
});

test("automationRunId incompatível com publishedAt/slot é bloqueado", async () => {
  const { dir } = await validAutomatedFixture({
    frontmatter: { automationRunId: "2026-07-16-morning" },
  });
  try {
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /automationRunId deve combinar/);
  } finally {
    cleanupFixture(dir);
  }
});

test("automationRunId com prefixo duplicado e ano longo são bloqueados", async () => {
  const { dir } = await validAutomatedFixture({
    frontmatter: { automationRunId: "2026-07-17-2026-07-17-morning" },
  });
  try {
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /fora do formato/);
  } finally {
    cleanupFixture(dir);
  }
});

test("data inexistente é bloqueada semanticamente", async () => {
  const { dir } = await validAutomatedFixture({
    frontmatter: {
      publishedAt: "2026-02-30",
      updatedAt: "2026-02-30",
      automationRunId: "2026-02-30-morning",
    },
  });
  try {
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /não é uma data de calendário válida/);
  } finally {
    cleanupFixture(dir);
  }
});

test("data automática futura em relação à data editorial é bloqueada", async () => {
  const { dir } = await validAutomatedFixture({
    frontmatter: {
      publishedAt: "2099-01-05",
      updatedAt: "2099-01-05",
      automationRunId: "2099-01-05-morning",
    },
  });
  try {
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /futuro em relação à data editorial/);
  } finally {
    cleanupFixture(dir);
  }
});

test("updatedAt anterior a publishedAt é bloqueado", async () => {
  const { dir } = await validAutomatedFixture({
    frontmatter: { updatedAt: "2026-07-10" },
  });
  try {
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /updatedAt .* anterior a publishedAt/);
  } finally {
    cleanupFixture(dir);
  }
});

test("branch divergente do artigo é bloqueada", async () => {
  const { dir } = await validAutomatedFixture();
  try {
    const wrongSlot = runScript(dir, "validate-article-content.mjs", {
      env: { GITHUB_HEAD_REF: "automation/artigo-2026-07-17-noite-artigo-automatico-teste" },
    });
    assert.equal(wrongSlot.code, 1);
    assert.match(wrongSlot.stderr, /exatamente um artigo evening/);

    const wrongSlug = runScript(dir, "validate-article-content.mjs", {
      env: { GITHUB_HEAD_REF: "automation/artigo-2026-07-17-manha-outro-slug" },
    });
    assert.equal(wrongSlug.code, 1);
    assert.match(wrongSlug.stderr, /slug/);
  } finally {
    cleanupFixture(dir);
  }
});

test("duas publicações no mesmo turno e data são bloqueadas", async () => {
  const { dir } = await validAutomatedFixture();
  try {
    const second = "segundo-artigo-do-turno";
    writeArticle(
      dir,
      second,
      automatedFrontmatter(second, {
        title: "Outro título completamente diferente sobre outro tema",
        description: "Outra descrição sem nenhuma relação com a primeira pauta.",
        topicKey: "outro-topico",
        primaryEntity: "Outra Entidade",
      }),
      `${articleBody(850)}\n\n${sourcesBlock(["https://www.ieee.org/standards/wifi7.html", "https://www.anatel.gov.br/consumidor/espectro"])}`
    );
    await writeNoiseCover(dir, second, { seed: 99 });
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /automationRunId duplica|turno morning duplicado/);
  } finally {
    cleanupFixture(dir);
  }
});

test("título e topicKey duplicados são bloqueados", async () => {
  const { dir, slug } = await validAutomatedFixture();
  try {
    const clone = "clone-de-titulo";
    writeArticle(
      dir,
      clone,
      automatedFrontmatter(clone, {
        title: `Título automático de ${slug}`,
        publicationSlot: "evening",
        automationRunId: "2026-07-17-evening",
        searchIntent: "practical",
        primaryEntity: "Entidade diferente",
        topicKey: `topico-${slug}`,
      }),
      `${articleBody(850)}\n\n${sourcesBlock(["https://www.ieee.org/standards/wifi7.html", "https://www.anatel.gov.br/consumidor/espectro"])}`
    );
    await writeNoiseCover(dir, clone, { seed: 42 });
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /title duplica/);
    assert.match(result.stderr, /topicKey duplica/);
  } finally {
    cleanupFixture(dir);
  }
});

test("manhã e noite não podem repetir primaryEntity nem searchIntent", async () => {
  const { dir } = await validAutomatedFixture();
  try {
    const evening = "artigo-da-noite";
    writeArticle(
      dir,
      evening,
      automatedFrontmatter(evening, {
        title: "Pauta noturna com título sem relação alguma",
        description: "Assunto totalmente distinto no período da noite.",
        publicationSlot: "evening",
        automationRunId: "2026-07-17-evening",
        topicKey: "topico-noturno",
        primaryEntity: "Entidade artigo-automatico-teste",
        searchIntent: "news",
      }),
      `${articleBody(850)}\n\n${sourcesBlock(["https://www.ieee.org/standards/wifi7.html", "https://www.anatel.gov.br/consumidor/espectro"])}`
    );
    await writeNoiseCover(dir, evening, { seed: 77 });
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /mesma primaryEntity/);
    assert.match(result.stderr, /mesma searchIntent/);
  } finally {
    cleanupFixture(dir);
  }
});

test("componente MDX não registrado é bloqueado", async () => {
  const { dir, slug } = await validAutomatedFixture();
  try {
    const file = path.join(dir, "content", "articles", `${slug}.mdx`);
    fs.appendFileSync(file, "\n<ComponenteFantasma texto=\"x\" />\n");
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /componente MDX não registrado: <ComponenteFantasma>/);
  } finally {
    cleanupFixture(dir);
  }
});

test("divergência entre registro MDX e allowlist derruba a validação", async () => {
  const { dir } = await validAutomatedFixture();
  try {
    const configPath = path.join(dir, "automation", "editorial-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.mdxComponents = config.mdxComponents.filter((name) => name !== "Callout");
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    const result = runScript(dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /diverge de src\/components\/mdx\/MdxContent\.tsx/);
  } finally {
    cleanupFixture(dir);
  }
});

test("fontes insuficientes e domínios repetidos são bloqueados", async () => {
  const oneSource = await validAutomatedFixture({ slug: "artigo-uma-fonte" });
  try {
    const file = path.join(oneSource.dir, "content", "articles", "artigo-uma-fonte.mdx");
    const body = fs.readFileSync(file, "utf8").replace(
      /<Sources[\s\S]*?\/>/,
      sourcesBlock(["https://developers.google.com/search/docs"])
    );
    fs.writeFileSync(file, body);
    const result = runScript(oneSource.dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /pelo menos 2 URLs HTTPS distintas/);
  } finally {
    cleanupFixture(oneSource.dir);
  }

  const sameDomain = await validAutomatedFixture({ slug: "artigo-mesmo-dominio" });
  try {
    const file = path.join(sameDomain.dir, "content", "articles", "artigo-mesmo-dominio.mdx");
    const body = fs.readFileSync(file, "utf8").replace(
      /<Sources[\s\S]*?\/>/,
      sourcesBlock([
        "https://developers.google.com/search/docs",
        "https://blog.google.com/products/search/novidade",
      ])
    );
    fs.writeFileSync(file, body);
    const result = runScript(sameDomain.dir, "validate-article-content.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /domínios registráveis distintos/);
  } finally {
    cleanupFixture(sameDomain.dir);
  }
});

test("WebP falso é bloqueado", async () => {
  const { dir, slug } = await validAutomatedFixture();
  try {
    await writeFakeWebp(dir, slug);
    const result = runScript(dir, "validate-article-images.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /formato real detectado: png/);
  } finally {
    cleanupFixture(dir);
  }
});

test("imagem acima do limite de bytes é bloqueada", async () => {
  const { dir } = await validAutomatedFixture({
    configOverrides: { images: { maxBytes: 1024 } },
  });
  try {
    const result = runScript(dir, "validate-article-images.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /comprima para no máximo 1 KB/);
  } finally {
    cleanupFixture(dir);
  }
});

test("proporção diferente de 16:9 é bloqueada", async () => {
  const { dir, slug } = await validAutomatedFixture();
  try {
    await writeCoverWithSize(dir, slug, 1600, 1000);
    const result = runScript(dir, "validate-article-images.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /não é 16:9/);
  } finally {
    cleanupFixture(dir);
  }
});

test("capa abaixo da dimensão mínima é bloqueada", async () => {
  const { dir, slug } = await validAutomatedFixture();
  try {
    await writeCoverWithSize(dir, slug, 1024, 576);
    const result = runScript(dir, "validate-article-images.mjs");
    assert.equal(result.code, 1);
    assert.match(result.stderr, /abaixo do mínimo 1200x675/);
  } finally {
    cleanupFixture(dir);
  }
});

test("capa perceptualmente duplicada: erro em PR automático, aviso fora dele", async () => {
  const { dir, slug } = await validAutomatedFixture();
  try {
    const second = "artigo-capa-parecida";
    writeArticle(
      dir,
      second,
      automatedFrontmatter(second, {
        title: "Assunto distinto com capa visualmente idêntica",
        description: "Pauta distinta para isolar o teste de imagem.",
        publicationSlot: "evening",
        automationRunId: "2026-07-17-evening",
        topicKey: "capa-parecida",
        primaryEntity: "Entidade distinta",
        searchIntent: "practical",
      }),
      `${articleBody(850)}\n\n${sourcesBlock(["https://www.ieee.org/standards/wifi7.html", "https://www.anatel.gov.br/consumidor/espectro"])}`
    );
    // Mesma imagem reprocessada com qualidade diferente: bytes distintos
    // (SHA-256 diferente), aparência idêntica (distância perceptual 0).
    const sharp = (await import("sharp")).default;
    await sharp(path.join(dir, "public", "images", "articles", `${slug}.webp`))
      .webp({ quality: 45 })
      .toFile(path.join(dir, "public", "images", "articles", `${second}.webp`));

    const strict = runScript(dir, "validate-article-images.mjs", {
      env: { GITHUB_HEAD_REF: "automation/artigo-2026-07-17-noite-artigo-capa-parecida" },
    });
    assert.equal(strict.code, 1);
    assert.match(strict.stderr, /perceptualmente duplicada/);

    const lenient = runScript(dir, "validate-article-images.mjs");
    assert.equal(lenient.code, 0, lenient.stderr);
    assert.match(lenient.stderr + lenient.stdout, /Semelhança perceptual forte/);
  } finally {
    cleanupFixture(dir);
  }
});

test("catálogo: ausente, desatualizado e hash divergente falham no --check", async () => {
  const { dir, slug } = await validAutomatedFixture();
  try {
    const missing = runScript(dir, "generate-editorial-catalog.mjs", { args: ["--check"] });
    assert.equal(missing.code, 1);
    assert.match(missing.stderr, /Manifesto editorial ausente/);

    const generate = runScript(dir, "generate-editorial-catalog.mjs");
    assert.equal(generate.code, 0, generate.stderr);
    const fresh = runScript(dir, "generate-editorial-catalog.mjs", { args: ["--check"] });
    assert.equal(fresh.code, 0, fresh.stderr);

    // Hash divergente: capa muda depois de o catálogo ter sido gerado.
    await writeNoiseCover(dir, slug, { seed: 1234 });
    const stale = runScript(dir, "generate-editorial-catalog.mjs", { args: ["--check"] });
    assert.equal(stale.code, 1);
    assert.match(stale.stderr, /desatualizado|registros desatualizados/);

    // Edição manual incompatível com a geração oficial.
    runScript(dir, "generate-editorial-catalog.mjs");
    const catalogPath = path.join(dir, "automation", "editorial-catalog.json");
    const manual = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    manual.articles[0].title = "Título adulterado manualmente";
    fs.writeFileSync(catalogPath, `${JSON.stringify(manual, null, 2)}\n`);
    const tampered = runScript(dir, "generate-editorial-catalog.mjs", { args: ["--check"] });
    assert.equal(tampered.code, 1);
    assert.match(tampered.stderr, /desatualizado/);
  } finally {
    cleanupFixture(dir);
  }
});

test("catálogo: registro ausente e excedente são apontados", async () => {
  const { dir } = await validAutomatedFixture();
  try {
    runScript(dir, "generate-editorial-catalog.mjs");
    const extra = "artigo-que-nao-existe-mais";
    writeArticle(
      dir,
      extra,
      automatedFrontmatter(extra, {
        title: "Registro novo ainda fora do catálogo",
        description: "Força um registro ausente no manifesto.",
        publicationSlot: "evening",
        automationRunId: "2026-07-17-evening",
        topicKey: "registro-ausente",
        primaryEntity: "Entidade nova",
        searchIntent: "practical",
      }),
      `${articleBody(850)}\n\n${sourcesBlock(["https://www.ieee.org/standards/wifi7.html", "https://www.anatel.gov.br/consumidor/espectro"])}`
    );
    await writeNoiseCover(dir, extra, { seed: 555 });
    const result = runScript(dir, "generate-editorial-catalog.mjs", { args: ["--check"] });
    assert.equal(result.code, 1);
    assert.match(result.stderr, /registros ausentes: artigo-que-nao-existe-mais/);
  } finally {
    cleanupFixture(dir);
  }
});
