# Runbook da automação editorial

Este documento é o contrato operacional resumido da automação de conteúdo da PulsoByte. Em caso de dúvida, a automação deve falhar fechada: não publicar é preferível a integrar conteúdo factual, jurídico ou tecnicamente inseguro.

Hierarquia de documentos: o plano mestre (`docs/Plano_Automacao_PulsoByte_2x_Dia.md`) define a política editorial completa; este runbook é o contrato operacional; **os valores compartilhados (horários, limites, padrões de identidade, componentes permitidos) vivem em `automation/editorial-config.json`** e são lidos pelos scripts, pelo workflow e pelo código. Não repita horário ou regex manualmente em outros lugares.

## Identidade e frequência

- `morning`: um artigo prático às **06:00** em `America/Sao_Paulo`.
- `evening`: uma pauta diferente às **20:30** em `America/Sao_Paulo`.
- `automationRunId`: `<publishedAt>-<publicationSlot>` (ex.: `2026-07-18-morning`).
- Limites: um artigo por turno, dois por data e nenhum reaproveitamento do turno perdido.

Todo artigo automático declara `publicationSlot`, `automationRunId`, `topicKey`, `primaryEntity`, `searchIntent` e, quando existir fonte primária, `primarySourceUrl`. A branch usa `automation/artigo-AAAA-MM-DD-manha-slug` ou `automation/artigo-AAAA-MM-DD-noite-slug`, com o mesmo slug do artigo.

## Manifesto editorial (catálogo)

`automation/editorial-catalog.json` é o inventário completo do acervo: slug, título normalizado, datas, slot, `automationRunId`, `topicKey`, entidade, intenção, fontes, capa com SHA-256 e hash perceptual, e imagens internas. Ele é **gerado por `npm run catalog:generate` e nunca editado manualmente**; o CI falha se estiver desatualizado (`npm run validate:catalog`). Um PR editorial automático contém exatamente: um novo `.mdx`, uma capa correspondente, até três imagens internas realmente usadas e a atualização gerada do manifesto.

O fallback por conector usa o catálogo para inventariar o acervo lendo **um único arquivo conhecido** pela API, sem listar a árvore do repositório.

## Gates editoriais

Antes de escrever, comparar dez pautas, aprofundar três e exigir simultaneamente: atenção ≥ 75/100; confiança factual ≥ 85/100; qualidade editorial ≥ 85/100; imagem ≥ 90/100.

Fonte primária é obrigatória quando existe — e deve ser declarada em `primarySourceUrl` e incluída no bloco de fontes. Alegações centrais precisam de duas confirmações realmente independentes (**dois domínios registráveis distintos**; duas páginas da mesma organização não contam). Datas, preços, versões, rollout e disponibilidade no Brasil devem ser verificados. Rumor nunca é fato.

Manhã e noite não podem repetir `topicKey`, entidade/produto, evento/pergunta, intenção ou imagem.

**O que o CI prova versus o que é responsabilidade do agente:** o CI verifica deterministicamente identidade, datas semânticas, duplicidade exata (`automationRunId`, slot, slug, título normalizado, `topicKey`), diversidade estrutural entre turnos (`primaryEntity`, `searchIntent`), similaridade **lexical** (Jaccard sobre shingles — limites em `automation/editorial-config.json`) e duplicidade perceptual de capas. O CI **não calcula similaridade semântica**; o julgamento semântico fino da pauta (parafrasear a mesma notícia com palavras diferentes) continua sendo gate editorial do agente antes de abrir o PR.

## Conteúdo e imagem

O PR contém exatamente um novo artigo, uma capa WebP correspondente, no máximo três imagens internas e o manifesto regenerado. A capa deve ser local, 16:9, no mínimo 1200×675, preferencialmente 1600×900, até 500 KB, com crédito, página original e licença. Capa perceptualmente duplicada de uma capa existente (distância aHash ≤ limite de bloqueio da configuração) é **erro** em PR automático. Não usar imagem gerada como registro documental de pessoa, produto ou notícia real.

O artigo usa somente componentes MDX registrados (a lista da configuração é comparada ao renderer real pelo CI e pelos testes), entrega valor original, inclui aplicação prática, limitações e pelo menos duas fontes HTTPS de domínios registráveis distintos.

## Validação e integração

Executar com Node 20 e `npm ci`:

```bash
npm test
npm run validate:catalog
npm run validate:content
npm run validate:images
npm run typecheck
npm run lint
npm run build
git diff --check
```

O workflow valida o merge sintético, restringe o diff à allowlist, bloqueia duplicidade e concorrência do mesmo turno consultando a branch padrão, os PRs e as branches remotas, serializa integrações, aguarda o Preview da Vercel, revalida quando a base muda (ver abaixo), realiza o squash merge preso ao head validado e roda o smoke test de produção com valores exatos. O agente e a guardiã nunca fazem merge, bypass administrativo, alteração de ruleset ou deploy manual.

São permitidos no máximo três ciclos locais de correção e duas tentativas da guardiã. Falha de fonte, licença, segurança, permissão ou proteção bloqueia a publicação.

## Mudança da branch padrão entre validação e merge

O workflow registra os SHAs de base e head usados na validação. Antes do merge:

1. consulta novamente base e head;
2. head mudou → aborta (o novo push dispara nova validação);
3. base mudou → reconstrói o merge sintético com a base atual e repete **toda** a suíte (escopo, concorrência, testes, catálogo, conteúdo, imagens, typecheck, lint, build, whitespace);
4. no máximo **duas** revalidações automáticas (`limits.maxBaseRevalidations`);
5. conflito de merge, terceira mudança concorrente ou falha em qualquer etapa → interrompe com estado explícito (`MERGE_ABORTED_*`) e deixa o PR aberto para recuperação. Conflito editorial nunca é resolvido automaticamente.

## Retomada de execução (idempotência)

Antes de criar qualquer objeto novo, a automação classifica o estado do `automationRunId` com `node scripts/automation/run-state.mjs <runId>`:

| Estado | Ação segura |
| --- | --- |
| `PUBLISHED_VERIFIED` | nada a fazer |
| `MERGED_AWAITING_PRODUCTION` | rodar smoke test; aguardar produção |
| `PR_OPEN_CI_RUNNING` | aguardar; não criar nada |
| `PR_OPEN_CI_PASSED` | aguardar o merge do workflow |
| `PR_OPEN_CI_FAILED` | corrigir **na mesma branch e mesmo PR** |
| `BRANCH_WITHOUT_PR` | abrir PR para a branch existente; nunca criar segunda branch |
| `ABANDONED` (branch >24 h sem PR) | parar; exige decisão humana |
| `BLOCKED_BEFORE_BRANCH` | não repetir sem resolver a causa |
| `NOT_STARTED` | iniciar do zero |

É proibido criar segunda pauta, segundo artigo, segunda branch, segundo commit independente ou segundo PR para o mesmo `automationRunId`. O `automationRunId` aparece no frontmatter, no catálogo, no corpo do PR e nos logs do workflow — o título do PR nunca é usado como identidade.

## Estados oficiais

```text
SCHEDULED → LOCKED → RESEARCHED → SELECTED → DRAFTED → VALIDATED
→ PR_OPEN → CI_RUNNING → PREVIEW_READY → MERGED → PROD_READY → VERIFIED
```

Encerramentos seguros: `SKIPPED_NO_STRONG_TOPIC`, `BLOCKED_DUPLICATE`, `BLOCKED_SOURCE`, `BLOCKED_IMAGE`, `BLOCKED_VALIDATION`, `BLOCKED_ACCESS`, `BLOCKED_INFRASTRUCTURE`, `BLOCKED_CONCURRENCY`, `GUARDIAN_EXHAUSTED`.
