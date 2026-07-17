# Runbook da automação editorial

Este documento é o contrato resumido da automação de conteúdo da PulsoByte. Em caso de dúvida, a automação deve falhar fechada: não publicar é preferível a integrar conteúdo factual, jurídico ou tecnicamente inseguro.

## Identidade e frequência

- `morning`: um artigo prático às 06:00 em `America/Sao_Paulo`.
- `evening`: uma pauta diferente às 20:00 em `America/Sao_Paulo`.
- `automationRunId`: `<publishedAt>-<publicationSlot>`.
- Limites: um artigo por turno, dois por data e nenhum reaproveitamento do turno perdido.

Todo artigo automático declara `publicationSlot`, `automationRunId`, `topicKey`, `primaryEntity` e `searchIntent`. A branch usa `automation/artigo-AAAA-MM-DD-manha-slug` ou `automation/artigo-AAAA-MM-DD-noite-slug`.

## Gates editoriais

Antes de escrever, comparar dez pautas, aprofundar três e exigir simultaneamente:

- atenção: 75/100 ou mais;
- confiança factual: 85/100 ou mais;
- qualidade editorial: 85/100 ou mais;
- imagem: 90/100 ou mais.

Fonte primária é obrigatória quando existe. Alegações centrais precisam de duas confirmações realmente independentes. Datas, preços, versões, rollout e disponibilidade no Brasil devem ser verificados. Rumor nunca é fato.

Manhã e noite não podem repetir `topicKey`, entidade/produto, evento/pergunta, intenção ou imagem. Similaridade semântica acima de 0,82 bloqueia a pauta.

## Conteúdo e imagem

O PR contém exatamente um novo artigo, uma capa WebP correspondente e no máximo três imagens internas. A capa deve ser local, 16:9, no mínimo 1200×675, preferencialmente 1600×900, até 500 KB, com crédito, página original e licença. Não usar imagem gerada como registro documental de pessoa, produto ou notícia real.

O artigo usa somente componentes MDX registrados, entrega valor original, inclui aplicação prática, limitações e pelo menos duas fontes HTTPS distintas.

## Validação e integração

Executar com Node 20 e `npm ci`:

```bash
npm run validate:content
npm run validate:images
npm run typecheck
npm run lint
npm run build
git diff --check
```

O workflow valida o merge sintético, restringe o diff, serializa integrações, aguarda o Preview da Vercel, confirma que a base não mudou, realiza o squash merge e verifica a publicação em produção. O agente e a guardiã nunca fazem merge, bypass administrativo, alteração de ruleset ou deploy manual.

São permitidos no máximo três ciclos locais de correção e duas tentativas da guardiã. Falha de fonte, licença, segurança, permissão ou proteção bloqueia a publicação.
