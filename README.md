# PulsoByte

**Tecnologia sem ruído.**

Portal editorial de tecnologia construído com Next.js (App Router), TypeScript estrito,
Tailwind CSS e artigos em MDX local — sem banco de dados. Cada arquivo `.mdx` adicionado à
pasta de conteúdo gera automaticamente a página, a URL, o card nas listagens, os metadados de
SEO, o tempo de leitura, os artigos relacionados e a entrada no sitemap.

## Como executar

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:3000 (rascunhos visíveis)
npm run build      # build de produção (apenas artigos publicados)
npm start          # serve o build de produção
npm run typecheck  # verificação de tipos
npm run lint       # lint
npm run covers     # regenera as capas de demonstração (sharp)
```

## Onde ficam os artigos

Todos os artigos vivem em `content/articles/`, um arquivo `.mdx` por artigo. As imagens ficam
em `public/images/articles/`.

## Como criar um artigo

1. Duplique `content/articles/exemplo-rascunho.mdx` com um novo nome.
2. Preencha o frontmatter:

```yaml
---
title: "Título do artigo"
description: "Descrição curta e útil."
slug: "titulo-do-artigo"            # único, minúsculas, números e hífens
category: "inteligencia-artificial" # um dos slugs de src/config/categories.ts
tags:
  - tecnologia
author: "Redação PulsoByte"
publishedAt: "2026-07-20"
updatedAt: "2026-07-20"
status: "draft"                     # draft = só em desenvolvimento
featured: false                     # true = destaque principal da home
coverImage: "/images/articles/capa.webp"
coverImageAlt: "Descrição acessível da imagem"
seoTitle: "Título para mecanismos de busca"
seoDescription: "Descrição para mecanismos de busca"
---
```

3. Escreva o conteúdo em Markdown/MDX. Componentes disponíveis: `Callout`, `KeyTakeaways`,
   `ProsAndCons`, `ComparisonTable`, `Sources`, `Figure`, `Quote`, `StepByStep` e `AdSlot`
   (veja exemplos nos artigos existentes).
4. **Para publicar**, troque `status: "draft"` por `status: "published"`. Rascunhos nunca
   aparecem em produção, na busca nem no sitemap.

A validação roda no build: campos obrigatórios ausentes, categoria inexistente ou slug
duplicado interrompem o build com uma mensagem explicando o problema.

## Como trocar imagens

- Coloque a capa em `public/images/articles/` (WebP ou AVIF, proporção 16:9, ~1280×720) e
  aponte `coverImage` para o caminho.
- As capas de demonstração são geradas por `npm run covers`
  (`scripts/generate-covers.mjs`) — substitua-as por imagens reais quando quiser.
- A imagem social padrão é `public/images/og-default.png` (1200×630).

## Como editar categorias

Tudo em `src/config/categories.ts`: nome, slug, descrição, títulos de SEO, ícone e ordem de
exibição. O menu, o rodapé, os filtros, as páginas `/categoria/[slug]` e o sitemap leem desse
único arquivo.

## Como mudar cores e textos da marca

- **Cores e fontes**: tokens no bloco `@theme` de `src/app/globals.css`.
- **Nome, slogan, descrição, e-mail e itens por página**: `src/config/site.ts`.
- **Logotipo**: `src/components/Logo.tsx` (horizontal) e `src/app/icon.svg` (favicon).

## Como preencher o domínio

Copie `.env.example` para `.env.local` (ou configure na hospedagem) e defina:

```bash
NEXT_PUBLIC_SITE_URL=https://www.seudominio.com.br
```

O valor alimenta canonical, sitemap, robots, Open Graph e JSON-LD.

## Onde inserir o código do AdSense

1. Defina a variável de ambiente com o seu ID de editor:

```bash
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
```

2. Pronto: o script global (`src/components/AdsenseScript.tsx`) passa a ser carregado em todo
   o portal, e os `<AdSlot slot="..." />` posicionados nos artigos passam a renderizar os
   blocos de anúncio.

Com a variável vazia, nada é carregado: sem scripts, sem espaços em branco e sem mudança de
layout.

## Estrutura do projeto

```text
content/articles/    artigos em MDX
public/images/       capas e imagem social
src/app/             rotas (App Router), sitemap, robots, favicon
src/components/      componentes de interface e de conteúdo (mdx/)
src/config/          site.ts e categories.ts — fonte única de configuração
src/lib/             carregamento/validação de artigos, busca, TOC, formatação
scripts/             geração das capas de demonstração
```
