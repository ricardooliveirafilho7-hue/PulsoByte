# PulsoByte

**Tecnologia sem ruído.**

Portal editorial de tecnologia construído com Next.js (App Router), TypeScript estrito,
Tailwind CSS e artigos em MDX local — sem banco de dados. Cada arquivo `.mdx` adicionado à
pasta de conteúdo gera automaticamente a página, a URL, o card nas listagens, os metadados de
SEO, o tempo de leitura, os artigos relacionados e a entrada no sitemap.

## Como executar

```bash
npm ci                    # instalação reproduzível (Node 20.x — ver .nvmrc)
npm run dev               # desenvolvimento em http://localhost:3000 (rascunhos visíveis)
npm run build             # build de produção (valida catálogo, conteúdo e imagens antes)
npm start                 # serve o build de produção
npm test                  # suíte de testes (node:test) dos validadores e da automação
npm run typecheck         # verificação de tipos
npm run lint              # lint (inclui scripts/ e tests/)
npm run catalog:generate  # regenera o manifesto editorial automation/editorial-catalog.json
npm run validate:catalog  # falha se o manifesto commitado estiver desatualizado
npm run validate:content  # validação editorial de conteúdo
npm run validate:images   # validação editorial de imagens
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
coverImageCaption: "Legenda curta que contextualiza a fotografia."
coverImageCredit: "Nome do fotógrafo ou empresa"
coverImageCreditUrl: "https://fonte-original.example/imagem"
coverImageSource: "Unsplash"
coverImageLicense: "Licença Unsplash"
coverImageType: "photo"              # photo, official, press, screenshot, diagram, illustration ou original
coverImagePosition: "50% 50%"        # ponto focal usado nos diferentes cortes
seoTitle: "Título para mecanismos de busca"
seoDescription: "Descrição para mecanismos de busca"
---
```

3. Escreva o conteúdo em Markdown/MDX. Componentes disponíveis: `Callout`, `KeyTakeaways`,
   `ProsAndCons`, `ComparisonTable`, `Sources`, `Figure`, `Quote`, `StepByStep` e `AdSlot`
   (veja exemplos nos artigos existentes).
4. **Para publicar**, troque `status: "draft"` por `status: "published"`. Rascunhos nunca
   aparecem em produção, na busca nem no sitemap.

Artigos automáticos seguem dois turnos em `America/Sao_Paulo` (manhã `06:00`, noite `20:30`):
no máximo um `morning` e um `evening` por data editorial. Eles também declaram
`publicationSlot`, `automationRunId`, `topicKey`, `primaryEntity`, `searchIntent` e,
quando existir, `primarySourceUrl`. Um PR editorial automático só pode conter: um novo
`.mdx`, sua capa, até três imagens internas usadas de verdade e a atualização gerada do
manifesto `automation/editorial-catalog.json` (`npm run catalog:generate`). O contrato
completo está em [`docs/automation-editorial.md`](docs/automation-editorial.md).

A validação roda no build: campos obrigatórios ausentes, categoria inexistente ou slug
duplicado interrompem o build com uma mensagem explicando o problema.

## Como trocar imagens

- Coloque a capa em `public/images/articles/` (preferencialmente WebP, 1600×900 e cerca de
  500 KB ou menos) e aponte `coverImage` para o caminho local.
- O arquivo deve ter o mesmo nome do slug e nunca deve ser carregado por hotlink.
- Registre autor, página original, fonte, licença e ponto focal no frontmatter.
- Consulte o processo completo e a checklist em [`docs/image-guidelines.md`](docs/image-guidelines.md).
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

A URL pública canônica tem uma única fonte de verdade:

- **Padrão (variável ausente ou vazia):** o site usa o domínio de produção confirmado em
  `automation/editorial-config.json` (`site.productionUrl`) — hoje,
  `https://pulso-byte.vercel.app`. Não existe mais fallback silencioso para um domínio não
  conectado.
- **Override explícito:** defina `NEXT_PUBLIC_SITE_URL` (em `.env.local` ou na Vercel). O
  valor precisa ser HTTPS, sem caminho e sem barra final; um valor inválido interrompe o
  build com mensagem explicando o problema.

O valor alimenta canonical, sitemap, robots, Open Graph e JSON-LD.

**Para migrar para o domínio personalizado (`www.pulsobyte.com.br`)**, na ordem:

1. conecte o domínio ao projeto `pulso-byte` na Vercel (Settings → Domains), confirmando
   propriedade, DNS e certificado;
2. defina o domínio principal na Vercel e o redirecionamento permanente (308) do domínio
   alternativo (apex ↔ www e o domínio `*.vercel.app`);
3. atualize `site.productionUrl` em `automation/editorial-config.json` (ou defina
   `NEXT_PUBLIC_SITE_URL` na Vercel — escolha UMA das duas vias e mantenha as duas coerentes);
4. atualize a variável `PRODUCTION_SITE` nas Variables do GitHub Actions, se estiver definida;
5. faça um deploy e rode `npm run smoke:production -- --slug <slug-existente>` apontando para
   o novo host.

Enquanto o domínio personalizado não estiver conectado na Vercel, **não** aponte canonical,
sitemap ou robots para ele.

## Onde inserir o código do AdSense

Política explícita por ambiente (`NEXT_PUBLIC_ADSENSE_CLIENT`):

- **Variável ausente:** o portal usa o ID padrão documentado
  (`ca-pub-8659303689605234`, o mesmo de `public/ads.txt`) e o AdSense fica **ativo**.
- **Variável definida e vazia** (`NEXT_PUBLIC_ADSENSE_CLIENT=`): AdSense completamente
  **desativado** — sem script global, sem espaços em branco e sem mudança de layout.
- **Variável definida com valor:** precisa seguir o formato `ca-pub-<dígitos>`; o valor tem
  precedência sobre o padrão. Um formato inválido interrompe o build.

O script global (`src/components/AdsenseScript.tsx`) é injetado uma única vez no layout, e os
`<AdSlot slot="..." />` dos artigos só renderizam com um ID numérico real de unidade.
O publisher ID não é secreto (aparece no HTML público e no `ads.txt`), mas precisa permanecer
coerente com `public/ads.txt`.

## Estrutura do projeto

```text
automation/          editorial-config.json (fonte única de valores) e
                     editorial-catalog.json (manifesto gerado — não editar)
content/articles/    artigos em MDX
public/images/       capas e imagem social
src/app/             rotas (App Router), sitemap, robots, favicon
src/components/      componentes de interface e de conteúdo (mdx/)
src/config/          site.ts e categories.ts — configuração da aplicação
src/lib/             carregamento/validação de artigos, busca, TOC, formatação
scripts/             validadores editoriais, catálogo e smoke test de produção
tests/               suíte node:test com fixtures temporárias
```

## Documentos canônicos

- `docs/Plano_Automacao_PulsoByte_2x_Dia.md` — plano mestre (política editorial completa);
- `docs/automation-editorial.md` — contrato operacional resumido da automação;
- `automation/editorial-config.json` — valores compartilhados (horários, limites, padrões);
- `docs/automation-guardian.md` — recuperação e acompanhamento (futura guardiã);
- `docs/automation-github-connector-fallback.md` — fallback por conector;
- este README — resumo para humanos; em conflito, valem os documentos acima.
