# Template — Artigo PulsoByte

O arquivo é MDX em `content/articles/<slug>.mdx`. O frontmatter abaixo usa os
nomes reais do projeto; categorias, formatos, intenções e componentes devem
respeitar `automation/editorial-config.json` e os validadores oficiais.

```yaml
---
title: "<Título final>"
description: "<Resumo direto>"
slug: "<slug-igual-ao-nome-do-arquivo>"
category: "<categoria de src/config/categories.ts>"
tags:
  - <tag-1>
  - <tag-2>
author: "Redação PulsoByte"
publishedAt: "AAAA-MM-DD"
updatedAt: "AAAA-MM-DD"
status: "published"
contentType: "<tipo permitido>"
featured: false
publicationSlot: "morning"
automationRunId: "AAAA-MM-DD-morning"
topicKey: "<entidade-produto-evento>"
primaryEntity: "<entidade principal>"
searchIntent: "<intenção permitida>"
primarySourceUrl: "https://<fonte-primaria-direta>"
coverImage: "/images/articles/<slug>.webp"
coverImageAlt: "<descrição específica>"
coverImageCaption: "<legenda útil>"
coverImageCredit: "<autor ou organização>"
coverImageCreditUrl: "https://<pagina-original-da-imagem>"
coverImageSource: "<origem>"
coverImageLicense: "<licença ou condição de uso>"
coverImageType: "<photo|illustration|screenshot|official-render>"
coverImagePosition: "50% 50%"
seoTitle: "<título SEO>"
seoDescription: "<descrição SEO>"
---
```

O corpo usa apenas componentes MDX registrados e inclui `Sources` ou
`SourceList` com URLs HTTPS diretas.
