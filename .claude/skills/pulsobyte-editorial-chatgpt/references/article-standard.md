# Padrão do Artigo, Título e SEO

## Idioma e voz
Português do Brasil, jornalista sênior de tecnologia. Natural, claro, objetivo,
preciso, fluido, acessível, baseado em evidências.

## Primeiro parágrafo (lede)
Responde imediatamente: o que aconteceu, quem está envolvido, quando, e por que
o leitor deve se importar. O assunto principal fica claro em segundos.

## Estrutura de conteúdo
Introdução → contexto → a novidade → como funciona → disponibilidade → impacto →
relevância para o Brasil → limitações → conclusão → fontes. Use somente os
componentes MDX registrados em `automation/editorial-config.json`.

## Tamanho
~900–1.600 palavras, ou o padrão real do projeto. Use só o espaço necessário.
Não infle com repetição.

## Campos (schema)
Use os nomes reais: `title`, `description`, `slug`, `category`, `tags`, `author`,
`publishedAt`, `updatedAt`, `status`, `contentType`, `featured`, `coverImage`,
`coverImageAlt`, `seoTitle` e `seoDescription`. Artigos automáticos também
declaram `publicationSlot`, `automationRunId`, `topicKey`, `primaryEntity`,
`searchIntent` e a proveniência completa da capa conforme o validador oficial.

## Título
Gere várias opções internas; escolha a mais forte que continue 100% verdadeira.
Deve: explicar a novidade principal, mencionar naturalmente a entidade/produto,
despertar curiosidade legítima, ser compreendido rápido, representar o conteúdo,
funcionar no site/busca/redes, sem exagero e sem afirmação absoluta não comprovada.
Compare candidatos por clareza, força, precisão, tamanho, SEO, curiosidade,
coerência com a imagem e capacidade de entregar o que promete.

## SEO
- Título SEO forte e verdadeiro.
- Descrição SEO que complementa o título (não repete).
- Slug curto, descritivo, estável, sem palavras desnecessárias.
- Palavra-chave principal + relacionadas, aparecendo naturalmente.
- Subtítulos que deixam a estrutura escaneável.
- Links internos só quando úteis; links externos para as fontes.

## Alt text
Descreve a imagem e sua relação com a matéria, sem repetir mecanicamente o título.
