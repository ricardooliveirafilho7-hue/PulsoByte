import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  loadEditorialConfig,
  normalizeText,
  isValidCalendarDate,
  todayInTimezone,
  parseAutomationRunId,
  parseAutomationBranch,
  registrableDomain,
  classifySourceUrl,
  lexicalSimilarity,
  parseRegisteredMdxComponents,
  validateEditorialScope,
  findRunConflicts,
  classifyRunState,
  planBaseRevalidation,
} from "../scripts/lib/editorial.mjs";
import { repoRoot } from "./helpers/fixtures.mjs";

const config = loadEditorialConfig(repoRoot);

test("normalizeText remove acentos e pontuação", () => {
  assert.equal(normalizeText("Ação — Título, número 7!"), "acao titulo numero 7");
});

test("datas de calendário: válidas e inválidas", () => {
  assert.equal(isValidCalendarDate("2026-07-17"), true);
  assert.equal(isValidCalendarDate("2024-02-29"), true, "ano bissexto");
  assert.equal(isValidCalendarDate("2026-02-30"), false, "dia inexistente");
  assert.equal(isValidCalendarDate("2026-00-10"), false, "mês 00");
  assert.equal(isValidCalendarDate("2026-13-01"), false, "mês 13");
  assert.equal(isValidCalendarDate("2026-04-31"), false, "31 de abril");
  assert.equal(isValidCalendarDate("20260-07-17"), false, "ano com 5 dígitos");
  assert.equal(isValidCalendarDate("226-07-17"), false, "ano com 3 dígitos");
  assert.equal(isValidCalendarDate("2026-7-17"), false, "mês sem zero à esquerda");
  assert.equal(isValidCalendarDate("2026/07/17"), false, "separador errado");
});

test("todayInTimezone resolve a virada do dia em America/Sao_Paulo", () => {
  // 2026-07-18T02:59Z ainda é 2026-07-17 23:59 em São Paulo (UTC-3).
  assert.equal(todayInTimezone("America/Sao_Paulo", new Date("2026-07-18T02:59:00Z")), "2026-07-17");
  // 2026-07-18T03:00Z já é 2026-07-18 00:00 em São Paulo.
  assert.equal(todayInTimezone("America/Sao_Paulo", new Date("2026-07-18T03:00:00Z")), "2026-07-18");
  // Virada de ano.
  assert.equal(todayInTimezone("America/Sao_Paulo", new Date("2027-01-01T01:00:00Z")), "2026-12-31");
});

test("automationRunId: formatos válidos e inválidos", () => {
  assert.deepEqual(parseAutomationRunId("2026-07-18-morning", config), {
    date: "2026-07-18",
    slot: "morning",
  });
  assert.equal(parseAutomationRunId("2026-07-18-evening-evening", config), null, "sufixo duplicado");
  assert.equal(parseAutomationRunId("2026-07-18-2026-07-18-morning", config), null, "prefixo duplicado");
  assert.equal(parseAutomationRunId("20261-07-18-morning", config), null, "ano com 5 dígitos");
  assert.equal(parseAutomationRunId("2026-02-30-morning", config), null, "data inexistente");
  assert.equal(parseAutomationRunId("2026-07-18-manha", config), null, "slot em português não é runId");
  assert.equal(parseAutomationRunId("", config), null);
});

test("branch automática: padrão e correspondência com turno", () => {
  assert.deepEqual(parseAutomationBranch("automation/artigo-2026-07-18-manha-guia-backup", config), {
    date: "2026-07-18",
    slot: "morning",
    slug: "guia-backup",
  });
  assert.equal(parseAutomationBranch("automation/artigo-2026-07-18-morning-slug", config), null, "token do slot em inglês");
  assert.equal(parseAutomationBranch("automation/artigo-2026-02-30-manha-slug", config), null, "data inexistente");
  assert.equal(parseAutomationBranch("automation/hardening-x", config), null);
});

test("domínio registrável (heurística)", () => {
  assert.equal(registrableDomain("www.globo.com"), "globo.com");
  assert.equal(registrableDomain("g1.globo.com"), "globo.com");
  assert.equal(registrableDomain("tec.exemplo.com.br"), "exemplo.com.br");
  assert.equal(registrableDomain("developers.google.com"), "google.com");
});

test("classificação de URLs de fonte", () => {
  assert.equal(classifySourceUrl("https://developers.google.com/search/docs").ok, true);
  assert.equal(classifySourceUrl("http://developers.google.com/search/docs").ok, false, "HTTP");
  assert.equal(classifySourceUrl("https://example.com/pagina").ok, false, "placeholder");
  assert.equal(classifySourceUrl("https://www.google.com/search?q=wifi").ok, false, "página de busca");
  assert.equal(classifySourceUrl("https://www.empresa.com/").ok, false, "homepage genérica");
  assert.equal(classifySourceUrl("nao-e-url").ok, false);
});

test("similaridade lexical: idêntico, parecido e distinto", () => {
  const a = "Como proteger o WhatsApp contra golpes em 2026";
  assert.equal(lexicalSimilarity(a, a), 1);
  assert.ok(lexicalSimilarity(a, "Como proteger o WhatsApp contra golpes em 2027") > 0.5);
  assert.ok(lexicalSimilarity(a, "Wi-Fi 7 explicado para iniciantes") < 0.1);
});

test("registro MDX real é idêntico à allowlist da configuração", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "src", "components", "mdx", "MdxContent.tsx"),
    "utf8"
  );
  const registered = parseRegisteredMdxComponents(source);
  assert.deepEqual(registered, [...config.mdxComponents].sort());
});

test("divergência entre registro MDX e allowlist é detectável", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "src", "components", "mdx", "MdxContent.tsx"),
    "utf8"
  );
  const altered = source.replace("SourceList: Sources,", "SourceList: Sources,\n  ComponenteNovo: Sources,");
  const registered = parseRegisteredMdxComponents(altered);
  assert.notDeepEqual(registered, [...config.mdxComponents].sort());
  assert.ok(registered.includes("ComponenteNovo"));
});

test("allowlist de escopo: PR editorial válido", () => {
  const result = validateEditorialScope(
    [
      { status: "A", file: "content/articles/novo-artigo.mdx" },
      { status: "A", file: "public/images/articles/novo-artigo.webp" },
      { status: "A", file: "public/images/articles/novo-artigo-detalhe.webp" },
      { status: "M", file: "automation/editorial-catalog.json" },
    ],
    config
  );
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.article, "content/articles/novo-artigo.mdx");
  assert.equal(result.cover, "public/images/articles/novo-artigo.webp");
});

test("allowlist de escopo: bloqueia dois artigos, arquivos fora da lista e manifesto ausente", () => {
  const twoArticles = validateEditorialScope(
    [
      { status: "A", file: "content/articles/um.mdx" },
      { status: "A", file: "content/articles/dois.mdx" },
      { status: "A", file: "public/images/articles/um.webp" },
      { status: "M", file: "automation/editorial-catalog.json" },
    ],
    config
  );
  assert.equal(twoArticles.ok, false);
  assert.ok(twoArticles.errors.some((error) => error.includes("mais de um artigo")));

  const badFile = validateEditorialScope(
    [
      { status: "A", file: "content/articles/um.mdx" },
      { status: "A", file: "public/images/articles/um.webp" },
      { status: "A", file: ".github/workflows/evil.yml" },
      { status: "M", file: "automation/editorial-catalog.json" },
    ],
    config
  );
  assert.equal(badFile.ok, false);
  assert.ok(badFile.errors.some((error) => error.includes(".github/workflows/evil.yml")));

  const noCatalog = validateEditorialScope(
    [
      { status: "A", file: "content/articles/um.mdx" },
      { status: "A", file: "public/images/articles/um.webp" },
    ],
    config
  );
  assert.equal(noCatalog.ok, false);
  assert.ok(noCatalog.errors.some((error) => error.includes("manifesto editorial")));

  const modifiedSource = validateEditorialScope(
    [
      { status: "M", file: "content/articles/antigo.mdx" },
      { status: "A", file: "content/articles/um.mdx" },
      { status: "A", file: "public/images/articles/um.webp" },
      { status: "M", file: "automation/editorial-catalog.json" },
    ],
    config
  );
  assert.equal(modifiedSource.ok, false);
});

test("conflitos de execução: runId integrado, PR aberto e branch do mesmo turno", () => {
  const base = {
    runId: "2026-07-18-morning",
    date: "2026-07-18",
    slot: "morning",
    topicKey: "novo-topico",
    prNumber: 50,
    headBranch: "automation/artigo-2026-07-18-manha-meu-artigo",
  };

  const integrated = findRunConflicts(
    {
      ...base,
      catalogArticles: [
        {
          file: "content/articles/outro.mdx",
          automationRunId: "2026-07-18-morning",
          publicationSlot: "morning",
          publishedAt: "2026-07-18",
          status: "published",
          topicKey: "outro-topico",
        },
      ],
    },
    config
  );
  assert.ok(integrated.some((conflict) => conflict.includes("mesmo automationRunId")));

  const twoPrs = findRunConflicts(
    {
      ...base,
      openPrs: [
        { number: 51, headRef: "automation/artigo-2026-07-18-manha-artigo-concorrente" },
      ],
    },
    config
  );
  assert.ok(twoPrs.some((conflict) => conflict.includes("#51")));

  const concurrentBranch = findRunConflicts(
    { ...base, branches: ["automation/artigo-2026-07-18-manha-terceiro"] },
    config
  );
  assert.ok(concurrentBranch.some((conflict) => conflict.includes("branch concorrente")));

  const sameTopic = findRunConflicts(
    {
      ...base,
      catalogArticles: [
        {
          file: "content/articles/antigo.mdx",
          automationRunId: "2026-07-10-morning",
          publicationSlot: "morning",
          publishedAt: "2026-07-10",
          status: "published",
          topicKey: "novo-topico",
        },
      ],
    },
    config
  );
  assert.ok(sameTopic.some((conflict) => conflict.includes('topicKey "novo-topico"')));

  const clean = findRunConflicts({ ...base }, config);
  assert.deepEqual(clean, []);
});

test("retomada: classificação de estados de execução", () => {
  assert.equal(
    classifyRunState({ integratedArticle: { slug: "x" }, productionVerified: true }).action,
    "done"
  );
  assert.equal(
    classifyRunState({ integratedArticle: { slug: "x" }, productionVerified: false }).state,
    "MERGED_AWAITING_PRODUCTION"
  );
  assert.equal(classifyRunState({ openPr: 4, ciStatus: "failure" }).action, "resume-pr");
  assert.equal(classifyRunState({ openPr: 4, ciStatus: "pending" }).action, "wait");
  assert.equal(classifyRunState({ openPr: 4, ciStatus: "success" }).action, "wait");
  assert.equal(classifyRunState({ branchExists: true, branchStaleHours: 2 }).action, "resume-branch");
  assert.equal(classifyRunState({ branchExists: true, branchStaleHours: 48 }).state, "ABANDONED");
  assert.equal(classifyRunState({ blockedMarker: "BLOCKED_SOURCE" }).action, "stop");
  assert.equal(classifyRunState({}).action, "start");
});

test("mudança de base entre validação e merge: revalidação limitada", () => {
  const sha1 = "a".repeat(40);
  const sha2 = "b".repeat(40);
  assert.equal(
    planBaseRevalidation({ validatedBase: sha1, currentBase: sha1, attempts: 0, maxAttempts: 2 }).action,
    "merge"
  );
  assert.equal(
    planBaseRevalidation({ validatedBase: sha1, currentBase: sha2, attempts: 0, maxAttempts: 2 }).action,
    "revalidate"
  );
  assert.equal(
    planBaseRevalidation({ validatedBase: sha1, currentBase: sha2, attempts: 1, maxAttempts: 2 }).action,
    "revalidate"
  );
  assert.equal(
    planBaseRevalidation({ validatedBase: sha1, currentBase: sha2, attempts: 2, maxAttempts: 2 }).action,
    "abort",
    "terceira mudança concorrente interrompe com estado explícito"
  );
});
