# Design System Editorial — PulsoByte

Sistema visual da PulsoByte: uma publicação digital brasileira de tecnologia
com estética editorial contemporânea. Distribuição aproximada: **75% editorial
limpo, 15% personalidade tecnológica, 10% interação e surpresa**.

## Filosofia

Cada elemento precisa cumprir ao menos uma função: informar, orientar,
explicar, comparar, hierarquizar, melhorar leitura, aumentar confiança ou
facilitar descoberta. Se não cumpre nenhuma, é removido.

Proibido: animação decorativa, cor sem significado, caixas desnecessárias,
glassmorphism, partículas, cursor customizado, confete, parallax, carrossel
automático, autoplay de mídia, scroll infinito por padrão.

## Cores

Todas as cores vivem como tokens em `src/app/globals.css` (bloco `@theme`) com
variantes clara/escura. **Nenhum componente usa hex solto** — a exceção são os
arquivos estáticos (`icon.svg`).

### Base papel (tema claro)

| Token | Valor | Uso |
| --- | --- | --- |
| `background` | `#F6F5F2` | fundo da página (papel quente) |
| `paper-deep` | `#ECE9E3` | placeholders de imagem, fundos rebaixados |
| `surface` | `#FFFFFF` | superfícies (cartões de conteúdo, painéis claros) |
| `ink` | `#17181C` | texto principal, regras fortes |
| `ink-soft` | `#2D2F35` | texto secundário forte |
| `muted` | `#5D6068` | metadados, legendas |
| `line` | `#D8D6D0` | divisórias |
| `line-soft` | `#E7E5E0` | divisórias sutis |

### Marca

| Token | Valor | Uso |
| --- | --- | --- |
| `brand` | `#4E6E87` | acento principal (azul editorial, calmo) |
| `brand-dark` | `#3F5F78` | hover de links, texto de destaque |
| `brand-soft` | `#E6EEF4` | fundos discretos |
| `brand-faint` | `#F1F5F8` | fundos quase imperceptíveis |

### Cores editoriais auxiliares

`red #8F4545`, `green #52614D`, `amber #74532E`, `violet #665B7C`, cada uma com
variante `-soft` para fundo. **Regra**: versões escuras para texto, borda e
indicador; versões claras somente como fundo. Nunca usar cor clara como texto
sobre branco.

### Painel sempre escuro

`panel #17181C`, `panel-ink`, `panel-muted`, `panel-line`, `panel-accent
#9BB4C8`. Usado no rodapé, no módulo analítico da home e em blocos de código.
Não inverte com o tema.

### Cores das editorias

A cor nunca é o único identificador — sempre acompanha o nome da editoria.
Mapeamento em `src/config/design-tokens.ts`:

| Editoria | Acento |
| --- | --- |
| Inteligência Artificial | violeta |
| Aplicativos | azul editorial (brand) |
| Tecnologia | azul editorial (brand) |
| Negócios Digitais | âmbar |
| Guias | verde |
| Comparativos | vermelho queimado |
| Notícias | azul escuro (brand-dark) |

## Dark mode

Sobrescrita de tokens em `:root[data-theme="dark"]` — não é inversão. Fundo
`#111216`, superfícies `#191B20`/`#22252B`, texto `#F1F1EE`, brand claro
`#9BB4C8`. Sem JavaScript, `prefers-color-scheme` é respeitado. A escolha
manual (Claro/Escuro/Sistema) fica no painel de preferências e persiste em
localStorage; um script inline no layout aplica o tema antes da pintura.

Regras: fotografias sem filtros globais; código continua legível (painel
escuro nos dois temas); `color-scheme` declarado para formulários nativos.

## Tipografia

- **Serifada** (Source Serif 4): manchetes, títulos de artigo, citações,
  números editoriais.
- **Sans-serif** (Geist): navegação, metadados, botões, tabelas, interfaces.

Corpo de artigo: `--article-size` (padrão ~18.5px, ajustável no painel de
preferências para 17px ou ~20.5px), linha 1.78, largura máxima
`--article-max` (45rem ≈ 66 caracteres; opção "Ampla" = 52rem). Títulos usam
`text-wrap: balance`.

## Espaçamento e grades

Container máximo de 1280px. Grades assimétricas na capa (8/4, 7/5). Divisórias
finas (`line`) e regras editoriais (`border-t-2 border-ink`, `.rule-double`)
no lugar de caixas com sombra. Raios de borda: nenhum — cantos retos,
estética de jornal.

## Movimento

- Microinterações: 120–220ms (`duration-150`/`duration-200`), apenas cor e
  transformações mínimas.
- Hover de imagem: `scale(1.02)` máximo.
- `prefers-reduced-motion: reduce` e a preferência manual "Movimento:
  Reduzido" zeram transições e o scroll suave.
- Nada de biblioteca de animação; apenas CSS.

## Links e botões

- Links no corpo do artigo: sublinhados (decoração na cor brand), nunca só
  cor.
- Botões primários: `bg-ink text-background` (funciona nos dois temas);
  hover `bg-brand`.
- Foco visível: contorno de 2px na cor brand em todo elemento interativo.
- Alvos de toque: mínimo 44×44px em controles isolados (`h-11 w-11`).

## Componentes editoriais

- **Capa** (`src/components/stories.tsx`): LeadStory, StoryListItem,
  HorizontalStory, TextStory, ImageStory, ComparisonStory — composições
  distintas do mesmo conteúdo, sem repetir card.
- **Artigo** (`src/components/mdx/`): ver `docs/article-formats.md`.
- **Interativos** (`src/components/interactive/`): SaveArticleButton,
  SavedArticlesList, GuideChecklist — todos com estado apenas em
  localStorage e fallback estático.
- **Preferências** (`src/components/preferences/`): painel de leitura.

## Exemplos corretos

- Etiqueta de editoria: nome textual + acento de cor (`Kicker`).
- Seção escura da home: `bg-panel text-panel-ink` (não `bg-ink text-white`).
- Novo bloco informativo de artigo: Server Component em
  `src/components/mdx/editorial.tsx`, com hairline e rótulo em versalete.

## Exemplos proibidos

- `text-cyan`, azul neon, gradientes saturados.
- Cor clara (`*-soft`) como cor de texto.
- `bg-ink` com `text-white` fixo (quebra no dark mode — usar `panel` ou
  `text-background`).
- Hex solto em componente novo.
- Animar entrada de cada parágrafo, atrasar conteúdo essencial.
- Card com sombra para toda listagem.
