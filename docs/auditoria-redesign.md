# Auditoria — PulsoByte Next (jul/2026)

Relatório da Etapa 1 do redesign editorial definitivo. Registra o estado do
projeto antes de qualquer alteração, os problemas encontrados e o plano de
implementação em etapas.

## Estado atual

- **Stack**: Next.js 15 (App Router), React 19, TypeScript estrito, Tailwind CSS 4,
  MDX local via `next-mdx-remote/rsc`, conteúdo estático em `content/articles/`.
- **Branch de produção (Vercel)**: `claude/pulsobyte-editorial-portal-8klfju`
  (HEAD do remoto). O redesign é desenvolvido em
  `claude/pulsobyte-editorial-redesign-dnue9i`, partindo do mesmo commit.
- **Linha de base**: `typecheck`, `lint` e `build` limpos; nenhum erro de
  console nas páginas principais (verificado com Chromium em 1440px e 390px).
- **Conteúdo**: 13 artigos publicados + 1 rascunho de exemplo, todos com
  imagem de capa validada por `scripts/validate-article-images.mjs` (executado
  no build).

### Páginas

| Rota | Situação |
| --- | --- |
| `/` | Capa editorial: manchete + Últimas, seções IA, fluxo, guias, comparativos, negócios (painel escuro), faixa de editorias. |
| `/artigos` | Arquivo cronológico com filtro por editoria e paginação. |
| `/artigos/[slug]` | Abertura centrada, imagem larga, corpo com share rail, índice e relacionados. |
| `/categoria/[slug]` | Manchete de abertura + lista, paginação. |
| `/buscar` | Busca GET sem JavaScript, ignora acentos (título, descrição, categoria, tags). |
| Institucionais | Sobre, Contato, Política Editorial, Privacidade, Cookies, Termos, 404, erro. |
| `robots.ts` / `sitemap.ts` | Presentes e corretos. |

### Componentes

- Vocabulário de capa em `stories.tsx` (Lead/Horizontal/Text/Image/Comparison/ListItem).
- `ArticleImage` com variantes de proporção, posição focal e selo de rascunho.
- MDX: Callout, KeyTakeaways, ProsAndCons, ComparisonTable, Sources, Figure,
  Quote, StepByStep, AdSlot (desligado sem `NEXT_PUBLIC_ADSENSE_CLIENT`).
- Acessibilidade já presente: skip link, foco visível, menu mobile com Esc,
  breadcrumbs com JSON-LD, `prefers-reduced-motion`, busca sem JS.

## Problemas encontrados

1. **Paleta com sensação SaaS**: azul `#5362FF` e ciano `#16C7CE` são
   fluorescentes; contradizem a direção "calma, sofisticada e editorial".
   O ciano `#16C7CE` sobre branco não passa de contraste para texto.
2. **Sem dark mode** e sem qualquer painel de preferências de leitura.
3. **Cores hard-coded** no logo (`Logo.tsx`, `icon.svg`) e classes soltas
   (`amber-400`, `amber-500`, `text-white`) fora do sistema de tokens.
4. **Um único formato de artigo**: não há `contentType`, prioridade
   editorial, status de revisão, dificuldade nem marcação evergreen.
5. **JSON-LD genérico**: todo artigo vira `Article`; notícias deveriam usar
   `NewsArticle`.
6. **Relacionados simplistas**: apenas categoria + tags; não considera
   formato, complementaridade, recência ou evergreen.
7. **Busca não cobre o corpo do texto** e não tem filtros.
8. **Sem trilhas** de aprendizado, sem área de conteúdo duradouro na home.
9. **Sem interações de leitor**: salvar artigo, modo foco, índice ativo,
   checklist de guia.
10. **`bg-ink`/`text-white` usados como cores fixas** em seções escuras —
    quebrariam num dark mode por inversão simples; exigem token de painel.
11. **Documentação**: existe apenas `docs/image-guidelines.md`; não há design
    system, formatos de artigo, acessibilidade nem performance documentados.

## Riscos e cuidados

- Tokens Tailwind 4 são consumidos como `var(--color-*)`: o dark mode pode ser
  feito por sobrescrita de variáveis, mas as seções sempre-escuras (rodapé,
  painel Negócios, `pre`) precisam migrar para um token próprio (`panel`).
- `validate-article-images.mjs` roda no build: qualquer campo novo de
  frontmatter deve ser **opcional com padrão** para não quebrar artigos atuais.
- `next-mdx-remote` v6 com `blockJS: false`: novos componentes MDX seguem
  recebendo props JSX; nada muda na segurança (conteúdo local do repositório).
- Não tocar em domínio, integração Vercel, robots, sitemap ou JSON-LD já
  existentes — apenas estender.

## Plano de implementação

- **Etapa 2 — Fundação**: nova paleta editorial (base papel + azul `#4E6E87` +
  cores auxiliares), tokens centralizados em `globals.css` +
  `src/config/design-tokens.ts`, dark mode verdadeiro com escolha manual e
  `prefers-color-scheme`, painel de preferências (tema, tamanho, largura,
  movimento, modo foco), logo e ícone na nova paleta.
- **Etapa 3 — Artigos**: schema de formatos (`contentType`, `editorialPriority`,
  `reviewStatus`, `difficulty`, `evergreen`), abertura mais informativa,
  biblioteca MDX ampliada (QuickSummary, Definition, ContextBox, WhyItMatters,
  FAQ, Timeline, QuickVerdict, BestFor, Checklist etc.), `NewsArticle` quando
  aplicável, relacionados com novo score.
- **Etapa 4 — Home e descoberta**: bloco "Agora", seção "Vale entender"
  (conteúdo duradouro), trilhas configuradas com artigos reais, busca no corpo
  do texto com filtros de tipo e editoria.
- **Etapa 5 — Interações**: salvar artigo (localStorage) + `/salvos`, modo
  foco, índice com seção ativa, checklist de guia persistente.
- **Etapa 6 — Qualidade**: documentação (`editorial-design-system.md`,
  `article-formats.md`, `accessibility.md`, `performance.md`), typecheck, lint,
  build, comparação visual e testes de teclado/reduced motion/dark mode.

Cada etapa é um commit próprio, com o build verde ao final.
