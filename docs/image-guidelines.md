# Diretrizes de imagens da PulsoByte

Toda matéria publicada precisa de uma imagem editorial específica, local, verificável e adequada
ao assunto. A fotografia não é um preenchimento visual: ela faz parte da informação do artigo.

## Fontes permitidas

- páginas oficiais de produtos, empresas e eventos;
- kits de imprensa e materiais oficiais identificados;
- Pexels, Unsplash e Wikimedia Commons;
- fotografias e capturas de tela produzidas pela PulsoByte;
- bancos com licença comercial compatível.

Não use imagens encontradas aleatoriamente em buscadores, não faça hotlink e não invente autor,
origem ou licença. Antes do download, abra a página individual da imagem e confirme a licença e o
nome do autor. Guarde essa URL em `coverImageCreditUrl`.

## Tipo de imagem por pauta

- `photo`: fotografia documental ou contextual real;
- `official`: imagem publicada oficialmente pelo fabricante ou empresa;
- `press`: material de kit de imprensa;
- `screenshot`: captura real de uma interface ou processo;
- `diagram`: diagrama factual necessário para explicar o tema;
- `illustration`: ilustração editorial usada quando uma fotografia não resolve a pauta;
- `original`: produção própria da PulsoByte.

Produtos devem mostrar o modelo correto. Aplicativos devem usar interface real. Comparativos devem
mostrar os itens comparados. Pessoas reais nunca devem ser substituídas por rostos gerados.

## Arquivo, dimensões e otimização

1. Salve a imagem em `public/images/articles/`.
2. Use exatamente o slug do artigo como nome, em letras minúsculas e com hífens.
3. Prefira WebP. Use AVIF apenas quando o ganho justificar o custo de processamento.
4. Produza 1600×900 px ou mais. O mínimo aceito para publicação é 1200×675 px.
5. Busque aproximadamente 500 KB ou menos sem degradar detalhes importantes.
6. Nunca reutilize uma capa genérica em artigos diferentes.

O build executa `npm run validate:images` e interrompe a publicação quando o arquivo está ausente,
externo, pequeno, duplicado, mal nomeado ou com metadados editoriais incompletos.

## Frontmatter completo

```yaml
coverImage: "/images/articles/slug-do-artigo.webp"
coverImageAlt: "Descrição objetiva do conteúdo visível"
coverImageCaption: "Legenda que relaciona a imagem à matéria"
coverImageCredit: "Nome do fotógrafo, empresa ou criador"
coverImageCreditUrl: "https://pagina-original-da-imagem"
coverImageSource: "Unsplash"
coverImageLicense: "Licença Unsplash"
coverImageType: "photo"
coverImagePosition: "50% 50%"
```

Para material próprio, use `coverImageCredit: "PulsoByte"`,
`coverImageSource: "Produção própria"` e o tipo adequado. Não invente uma licença para material
oficial; descreva a origem como material oficial ou de imprensa.

## Texto alternativo, legenda e crédito

O texto alternativo descreve o que está visível e relevante, sem começar por “imagem de”. A legenda
explica por que aquela cena ajuda a entender o artigo. O crédito reproduz o nome publicado pela
fonte. Quando houver página original, o crédito deve apontar para ela.

## Ponto focal e testes de corte

`coverImagePosition` vira `object-position` em todas as variações do componente `ArticleImage`.
Comece em `50% 50%` e ajuste para proteger rostos, produtos, telas, logos e elementos posicionados
nas laterais. Teste os cortes 16:9, 4:3 e 1:1 no desktop e no celular, incluindo 1440, 1024, 768,
430, 375 e 320 px.

## Como adicionar ou substituir uma imagem

1. Confirme que a foto representa diretamente a pauta e que a licença permite o uso editorial.
2. Baixe o arquivo original; nunca aponte `coverImage` para uma URL externa.
3. Corrija orientação, enquadre, redimensione e converta para WebP.
4. Salve com o slug na pasta de artigos.
5. Preencha todos os campos de imagem no frontmatter.
6. Abra a home, a editoria, a busca, a lista geral, o artigo e os relacionados.
7. Ajuste o ponto focal e execute `npm run validate:images`, `npm run typecheck`, `npm run lint` e
   `npm run build`.

Rascunhos podem usar uma capa provisória durante o desenvolvimento. O site exibe o aviso “Imagem
provisória — substituir antes de publicar”; essa condição não é permitida em artigos publicados.

## Checklist antes da publicação

```text
[ ] A imagem representa diretamente o assunto?
[ ] A imagem é real, oficial, licenciada ou própria?
[ ] O arquivo está salvo localmente?
[ ] O nome do arquivo corresponde ao slug?
[ ] A resolução é suficiente?
[ ] O arquivo foi otimizado?
[ ] O texto alternativo descreve a imagem?
[ ] O crédito está correto?
[ ] A fonte está correta?
[ ] O ponto focal funciona no desktop?
[ ] O ponto focal funciona no celular?
[ ] A imagem não está sendo usada em outro artigo sem motivo?
[ ] A legenda está correta?
[ ] O artigo pode ser publicado?
```
