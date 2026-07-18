---
name: pulsobyte-editorial
description: Executa, diagnostica e acompanha o pipeline editorial automático da PulsoByte no repositório ricardooliveirafilho7-hue/PulsoByte. Use para turnos morning/evening, testes manuais sem publicação, guardião de PRs editoriais e auditoria de infraestrutura. Aplica identidade determinística, idempotência, pesquisa factual, imagem, validação, PR não-draft e recuperação por conector GitHub sem merge manual.
---

# PulsoByte Editorial

## Objetivo

Executar o pipeline editorial da PulsoByte com comportamento determinístico, auditável e fail-closed. Esta habilidade reduz o prompt de cada automação a uma entrada mínima e concentra aqui as regras operacionais.

Ela não promete ausência de falhas externas. Ela impede que uma falha externa, uma entrada malformada ou uma etapa incompleta vire publicação duplicada, insegura ou tecnicamente inválida.

## Entradas aceitas

Use exatamente um modo:

1. `editorial`
   - exige `publicationSlot=morning|evening`;
   - resolve `editorialDate` em `America/Sao_Paulo`;
   - produz no máximo um artigo;
   - pode criar uma branch e um PR editorial.
2. `manual-infra-test`
   - nunca define turno;
   - nunca cria `automationRunId`;
   - nunca cria artigo, imagem, branch, commit, PR ou workflow;
   - apenas verifica acessos, contratos, infraestrutura e validadores.
3. `guardian`
   - acompanha somente PRs `automation/artigo-*` recentes;
   - pode corrigir, na mesma branch, somente arquivos já pertencentes ao PR;
   - nunca faz merge nem habilita auto-merge.
4. `infrastructure-audit`
   - somente quando explicitamente solicitado;
   - pode preparar um PR de infraestrutura separado;
   - nunca publica artigo no mesmo trabalho.

Não inferir o modo a partir do horário, do texto anterior ou da existência de uma automação. A entrada explícita vence.

## Fase 1 — Identidade determinística

Antes de qualquer leitura extensa ou escrita, execute:

```bash
python scripts/resolve_run_identity.py \
  --mode editorial \
  --slot morning
```

Para uma data fornecida pelo disparador:

```bash
python scripts/resolve_run_identity.py \
  --mode editorial \
  --slot morning \
  --editorial-date 2026-07-18 \
  --automation-run-id 2026-07-18-morning
```

Use o JSON retornado como única fonte para:

- `editorialDate`;
- `publicationSlot`;
- `automationRunId`;
- segmento `manha|noite`;
- regex e prefixo da branch.

Regras absolutas:

- timezone: `America/Sao_Paulo`;
- `automationRunId`: `YYYY-MM-DD-morning|evening`;
- regex: `^[0-9]{4}-[0-9]{2}-[0-9]{2}-(morning|evening)$`;
- ano com exatamente quatro dígitos;
- data civil válida;
- sufixo idêntico ao slot;
- nenhuma duplicação de prefixo;
- branch editorial: `automation/artigo-YYYY-MM-DD-manha-<slug>` ou `automation/artigo-YYYY-MM-DD-noite-<slug>`.

Qualquer divergência encerra `BLOCKED_VALIDATION` antes de escrita.

## Fase 2 — Autoridades e revisão-base

1. Consultar a API do GitHub para descobrir a branch padrão. Nunca presumir `main`.
2. Registrar o SHA exato da ponta como `sourceRevision`.
3. Ler na mesma revisão, integralmente:
   - `AGENTS.md`;
   - `docs/Plano_Automacao_PulsoByte_2x_Dia.md`;
   - `docs/automation-github-connector-fallback.md`;
   - `README.md`;
   - `package.json` e lockfile;
   - `.nvmrc`;
   - `automation/editorial-config.json`;
   - `automation/editorial-catalog.json`;
   - `src/components/mdx/MdxContent.tsx`;
   - scripts de automação e validadores;
   - `.github/workflows/automated-content.yml`.
4. Tratar os arquivos do repositório como autoridade operacional atual.
5. Em conflito entre documentos:
   - segurança, idempotência, allowlist e proibição de merge manual são absolutas;
   - `AGENTS.md` e configuração executável atual prevalecem para limites implementados;
   - registrar a divergência no relatório;
   - não inventar uma conciliação que amplie permissão de escrita.

Se contratos ou catálogo não puderem ser lidos integralmente na `sourceRevision`, encerrar `BLOCKED_CANONICAL_DOCUMENT` ou `BLOCKED_INFRASTRUCTURE`, conforme a causa.

## Fase 3 — Preflight local e fallback

### Caminho local preferencial

1. Confirmar autenticação e permissão do GitHub.
2. Confirmar acesso ao projeto Vercel.
3. Tentar clone limpo ou `git worktree` descartável a partir de `sourceRevision`.
4. Fazer até três tentativas somente quando a falha for DNS, rota, timeout ou conexão externa.
5. Confirmar versão de Node definida pelo repositório e lockfile npm.
6. Executar `npm ci`.
7. Exigir árvore limpa com `git status --porcelain` vazio.
8. Validar catálogo antes de qualquer seleção editorial.

### Ativação de `CONNECTOR_FALLBACK`

Ativar apenas quando todas forem verdadeiras:

- as três tentativas locais falharam exclusivamente por conectividade externa;
- o conector GitHub lê e escreve no repositório;
- a branch padrão e `sourceRevision` foram confirmadas;
- o conector Vercel consulta o projeto;
- o catálogo completo pode ser lido e validado como fonte de inventário;
- blobs binários podem ser criados e lidos de volta;
- arquivos temporários e processamento de imagem funcionam.

Nunca usar fallback para esconder erro de autenticação, permissão, contrato, conteúdo, catálogo ou validador.

No fallback, seguir integralmente `references/connector-fallback-checklist.md`.

## Fase 4 — Trava de idempotência e concorrência

Antes de pesquisar, antes de criar branch e antes do commit final, verificar:

- `automationRunId` exato;
- data e `publicationSlot`;
- slug;
- título normalizado;
- `topicKey`;
- `primaryEntity`;
- produto, evento ou pergunta central;
- `searchIntent`;
- URL primária;
- artigos e catálogo;
- branches remotas;
- PRs abertos, fechados e integrados;
- workflows e execuções recentes;
- estado do turno da manhã quando o slot for `evening`.

Executar, quando disponível:

```bash
node scripts/automation/run-state.mjs <automationRunId>
```

Obedecer exatamente à ação retornada:

- retomar a mesma branch/PR;
- aguardar;
- parar;
- continuar.

Nunca criar segunda branch, segundo artigo ou segundo PR para o mesmo `automationRunId`. Não usar sufixos `-02`, `-03` ou equivalentes para contornar conflito.

Semelhança:

- igualdade de identidade, slug, título normalizado, `topicKey`, entidade+evento ou URL primária: `BLOCKED_DUPLICATE`;
- similaridade semântica acima de `0.82`: bloquear;
- faixa `0.70–0.82`: aceitar somente com diferença material de formato, intenção, perguntas e utilidade;
- mudança cosmética de título não cria pauta nova.

Se a branch padrão mudar após `sourceRevision`, reconstruir o inventário e repetir a seleção. Sem reconstrução segura: `BLOCKED_CONCURRENCY`.

## Fase 5 — Seleção editorial

Somente no modo `editorial`:

1. Produzir internamente dez pautas em pelo menos cinco grupos editoriais.
2. Eliminar duplicadas e pautas sem imagem viável antes da escolha final.
3. Aprofundar três finalistas em condições equivalentes.
4. Dar notas independentes:
   - atenção: mínimo `75/100`;
   - confiança factual: mínimo `85/100`;
   - qualidade editorial: mínimo `85/100`;
   - aderência da imagem: mínimo `90/100`.
5. Rejeitar qualquer pauta com gate eliminatório, mesmo que a média seja alta.

Manhã favorece utilidade prática e duradoura. Noite favorece novidade confirmada, análise ou alerta; sem notícia forte, usar pauta perene materialmente diferente.

O turno noturno deve diferir da manhã em:

- `topicKey`;
- entidade e produto principais;
- evento ou pergunta central;
- intenção;
- título;
- imagem;
- preferencialmente `contentType`.

Sem pauta forte: `SKIPPED_NO_STRONG_TOPIC`. Não publicar para preencher horário.

## Fase 6 — Pesquisa factual

Para a pauta vencedora:

- localizar fonte primária quando deveria existir;
- obter duas confirmações independentes para fatos centrais;
- registrar data do evento, publicação e atualização;
- confirmar nomes, números, unidades, versões, preços e países;
- verificar disponibilidade no Brasil quando mencionada;
- separar anúncio, teste, beta, rollout, lançamento e disponibilidade pública;
- procurar correções e evidência contrária;
- resolver contradições ou enfraquecer a afirmação;
- usar URLs diretas das fontes realmente utilizadas;
- pesquisar novamente antes do commit em assuntos voláteis.

Nunca inventar fato, citação, preço, disponibilidade, fonte ou condição de licença.

## Fase 7 — Artigo e imagem

### Artigo

- exatamente um novo `content/articles/<slug>.mdx`;
- usar apenas campos, categorias, formatos e componentes registrados;
- declarar `publicationSlot`, `automationRunId`, `topicKey`, `primaryEntity` e `searchIntent`;
- `status: published` e `reviewStatus: reviewed` somente após completar pesquisa e revisão;
- resposta principal no início;
- profundidade adequada ao formato, sem preenchimento artificial;
- fatos separados de análise;
- limitações explícitas;
- links internos válidos;
- seção de fontes;
- conclusão útil;
- tom humano, claro e brasileiro;
- título atraente sem clickbait enganoso.

### Imagem

Antes de fechar a pauta, confirmar ao menos uma origem de imagem viável e auditável.

Ordem preferencial:

1. press kit ou imagem oficial com uso editorial identificado;
2. imagem oficial do produto/interface;
3. screenshot próprio sem dados privados;
4. Wikimedia Commons com licença individual;
5. Unsplash/Pexels para contexto;
6. ilustração original apenas em tema abstrato.

Nunca usar representação gerada que pareça documental para pessoa ou notícia real.

A capa deve:

- ser WebP verdadeiro e decodificável;
- ter alvo `1600x900`, mínimo `1200x675`, proporção 16:9;
- ter até `512000` bytes;
- não ser animada;
- ter nome igual ao slug;
- remover metadados pessoais;
- ter origem, crédito, URL, licença, legenda, tipo e posição registrados;
- ter SHA-256 e hash perceptual diferentes do catálogo;
- funcionar em desktop e mobile.

No fallback, usar o preparador do repositório e verificar o blob após upload.

## Fase 8 — Limite de escrita

Um PR editorial normal pode conter somente:

- exatamente um novo `.mdx` em `content/articles/`;
- exatamente uma nova capa `.webp` em `public/images/articles/`;
- até três imagens internas novas, justificadas e realmente usadas;
- atualização determinística de `automation/editorial-catalog.json`.

É proibido no PR editorial:

- apagar arquivos;
- alterar `.github/`, `src/`, `package.json`, lockfile, configuração Vercel, AdSense, segurança ou design global;
- adicionar dependência;
- editar artigo já publicado;
- alterar validador para fazer o conteúdo passar;
- misturar infraestrutura e conteúdo.

Qualquer necessidade fora da allowlist encerra `BLOCKED_INFRASTRUCTURE` e deve ser tratada em trabalho separado e explícito.

## Fase 9 — Validação e autocorreção

No caminho local, usar a suíte real declarada pelo repositório. Quando disponíveis, executar:

```bash
npm test
npm run validate:catalog
npm run validate:content
npm run validate:images
npm run typecheck
npm run lint
npm run build
git diff --check
git status --short
```

Também:

- procurar segredos e arquivos `.env` no diff;
- revisar home, listagem, categoria, artigo, relacionados e sitemap;
- revisar 1440, 430 e 320 px;
- revisar corte, overflow, componentes, créditos e anúncios;
- gerar screenshots temporários, nunca commitá-los.

Autocorreção:

- máximo de três ciclos;
- corrigir somente a causa encontrada;
- repetir primeiro o teste específico e depois a suíte completa;
- nunca desabilitar uma regra;
- falha antiga ou não relacionada bloqueia e é relatada;
- após três ciclos: `BLOCKED_VALIDATION`.

No fallback, não declarar sucesso antes do GitHub Actions executar as verificações que exigem checkout completo.

## Fase 10 — Branch, commit e PR

Somente depois de todas as travas:

1. reconfirmar que a base continua em `sourceRevision`;
2. criar a branch exata derivada da identidade e do slug;
3. produzir um único commit coerente;
4. conferir o diff e a allowlist;
5. ler a capa de volta e confirmar bytes/SHA-256 quando enviada por conector;
6. abrir PR não-draft contra a branch padrão descoberta pela API;
7. registrar no corpo do PR todas as evidências pedidas em `assets/pr-body-template.md`;
8. encerrar a fase de escrita.

O agente nunca:

- faz push direto na branch padrão;
- executa merge manual;
- habilita auto-merge no PR;
- aprova o próprio PR;
- usa `--admin`;
- altera ruleset;
- publica manualmente na Vercel.

O workflow `.github/workflows/automated-content.yml` é a única autoridade de merge.

## Fase 11 — Guardião

No modo `guardian`:

- agir somente em PR `automation/artigo-*` recente, workflow pendente/falho ou produção recém-integrada ainda não verificada;
- ler jobs e logs antes de corrigir;
- classificar a causa como conteúdo, imagem, pesquisa, infraestrutura transitória, Vercel, permissão ou segurança;
- corrigir somente arquivos já criados pelo mesmo PR;
- máximo de duas tentativas do guardião por PR;
- executar novamente a suíte;
- nunca alterar arquitetura;
- nunca fazer merge;
- após duas falhas: `GUARDIAN_EXHAUSTED`.

Depois do merge, confirmar deploy de produção do SHA, HTTP 200, título, descrição, canonical, capa WebP, JSON-LD, sitemap, listagem e ausência de erro de runtime.

## Saída obrigatória

Sempre terminar com um relatório curto e estruturado conforme `assets/final-report-template.md`.

O estado final deve ser um dos códigos documentados em `references/status-codes.md`.

Nunca mascarar uma etapa não executada como concluída. Diferenciar claramente:

- verificado localmente;
- delegado ao CI;
- aguardando serviço externo;
- bloqueado;
- publicado e confirmado em produção.
