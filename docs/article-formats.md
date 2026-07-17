# Formatos de Artigo — PulsoByte

Nem todo conteúdo tem a mesma estrutura. O formato é declarado no frontmatter
e muda a apresentação, o JSON-LD e as recomendações.

## Frontmatter editorial

```yaml
contentType: "news"        # obrigatório na prática (padrão por categoria)
editorialPriority: "standard"  # lead | featured | standard
reviewStatus: "reviewed"   # draft | fact-check | reviewed | published | needs-update
difficulty: "beginner"     # beginner | intermediate | advanced (opcional)
evergreen: true            # opcional; padrão: true para explainer/guide/comparison
```

Valores aceitos de `contentType`: `news`, `explainer`, `guide`, `comparison`,
`analysis`, `review`, `visual-story`, `opinion`. Validação em
`src/lib/articles.ts`; rótulos e padrões em `src/config/editorial.ts`.

- Sem `contentType`, o formato é inferido da categoria (`noticias → news`,
  `guias → guide`, `comparativos → comparison`, `negocios-digitais →
  analysis`, demais → `explainer`).
- `reviewStatus` alimenta os indicadores da abertura ("Conteúdo revisado",
  "Em checagem", "Aguardando atualização"). `reviewed` é o padrão de artigos
  publicados.
- Artigos `news` recebem `NewsArticle` no JSON-LD; os demais, `Article`.

## Estruturas recomendadas

- **Notícia**: título → linha fina → fatos principais (`QuickSummary`) →
  o que aconteceu → por que importa (`WhyItMatters`) → contexto
  (`ContextBox`) → próximos passos → fontes (`SourceList`) → histórico
  (`UpdateHistory`).
- **Explicador**: resumo em 30 segundos (`QuickSummary`) → definição
  (`Definition`) → como funciona → exemplo → por que importa → limitações →
  `FAQ` → conclusão.
- **Guia**: objetivo → `Requirements` (tempo, nível, pré-requisitos) →
  `StepByStep` → erros comuns (`Troubleshooting`) → `GuideChecklist`.
- **Comparativo**: `QuickVerdict` → `BestFor` → `ComparisonTable` →
  comparação aprofundada → `ProsAndCons` → cenários de uso →
  `FinalVerdict`.
- **Análise**: tese → evidências → contexto → consequências → contrapontos →
  riscos → `FinalVerdict`.

## Biblioteca MDX

Registrada em `src/components/mdx/MdxContent.tsx`. Todos os componentes
informativos são Server Components (zero JavaScript no cliente); apenas
`GuideChecklist` é interativo.

### Básicos (`src/components/mdx/index.tsx` e `editorial.tsx`)

| Componente | Uso |
| --- | --- |
| `QuickSummary items={[...]}` | "Em 30 segundos" — 3 ou 4 pontos. Não usar em artigos muito curtos. |
| `KeyTakeaways items={[...]}` | pontos principais |
| `Definition term="...">…` | definição de termo técnico |
| `ContextBox title?>…` | contexto que não interrompe a leitura |
| `WhyItMatters>…` | por que importa |
| `WhatChanged>…` | o que mudou (notícias) |
| `FAQ items={[{question, answer}]}` | perguntas frequentes (`<details>`, sem JS) |
| `Timeline items={[{date, title, description?}]}` | linha do tempo |
| `SourceList items={[{label, url}]}` | fontes (alias de `Sources`) |
| `CorrectionNote date="...">…` | correção transparente |
| `UpdateHistory items={[{date, change}]}` | histórico de atualizações |
| `Callout type="info|warning|tip"` | aviso no fluxo |
| `Quote author? role?>…` | citação |
| `Figure src alt caption?` | imagem com legenda |

### Guias

`Requirements items time? level?`, `StepByStep steps={[{title,
description}]}`, `Troubleshooting items={[{problem, solution}]}`,
`GuideChecklist id="slug-do-guia" items={[...]}` (progresso em localStorage).

### Comparativos

`QuickVerdict`, `ComparisonTable caption headers rows`, `BestFor
items={[{option, audience}]}`, `ProsAndCons pros cons`, `FinalVerdict`.

### Regras técnicas

- Componente informativo = Server Component; interatividade só quando
  indispensável, isolada em `src/components/interactive/`.
- Nenhum componente depende apenas de hover; tudo opera por teclado.
- Visualizações precisam de título/descrição e equivalente textual.
- Imagens com legenda e crédito (sistema `ArticleImage` + validação de build).
- Vídeo/áudio: apenas com fonte real e legalmente incorporável; player só
  carrega após interação; nunca autoplay; nunca botão falso sem arquivo.

## Trilhas

Sequências curadas de artigos reais em `src/config/trails.ts` (slug, título,
objetivo, nível, lista ordenada de slugs). A montagem (`src/lib/trails.ts`)
ignora slugs não publicados e calcula o tempo total. Exibidas na home e como
"próximo passo" na página do artigo.
