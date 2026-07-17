# Instruções para agentes no PulsoByte

Estas regras se aplicam a qualquer agente que trabalhe neste repositório.

## Automação editorial em dois turnos

Quando a tarefa for criar o artigo automático diário:

1. Sincronize-se com a branch padrão antes de começar.
2. Crie uma branch `automation/artigo-AAAA-MM-DD-manha-slug` ou `automation/artigo-AAAA-MM-DD-noite-slug`.
3. Produza no máximo um artigo por execução, um no turno `morning` e um no turno `evening`, totalizando no máximo dois por data editorial em `America/Sao_Paulo`.
4. Todo artigo automático deve declarar `publicationSlot`, `automationRunId`, `topicKey`, `primaryEntity` e `searchIntent`.
5. Uma falha ou ausência de pauta em um turno não autoriza publicar dois artigos no outro.
6. A matéria noturna nunca pode reutilizar `topicKey`, evento, produto ou entidade principal da manhã.
7. Altere somente um novo artigo, sua capa, até três imagens internas justificadas e o manifesto gerado `automation/editorial-catalog.json` (regenerado com `npm run catalog:generate`, nunca editado manualmente).
8. Antes de criar qualquer branch, classifique o estado da execução com `node scripts/automation/run-state.mjs <automationRunId>` e obedeça à ação retornada (retomar o mesmo PR/branch, aguardar ou parar). Nunca crie segunda branch, segundo artigo ou segundo PR para o mesmo `automationRunId`.
9. Execute `npm test`, `npm run validate:catalog`, `npm run validate:content`, `npm run validate:images`, `npm run typecheck`, `npm run lint` e `npm run build` antes de enviar a branch.
10. Abra um Pull Request não marcado como draft contra a branch padrão.
11. Não faça push direto na branch padrão.
12. Não execute `gh pr merge`, `gh pr merge --auto`, `merge_pull_request` ou qualquer comando equivalente.
13. Não habilite auto-merge diretamente no Pull Request.
14. Não tente aprovar o próprio Pull Request, ignorar checks, usar `--admin`, alterar rulesets ou contornar proteções.
15. Após abrir o Pull Request, encerre a parte de escrita e deixe o workflow `.github/workflows/automated-content.yml` executar os checks, aguardar a Vercel e realizar o squash merge automaticamente.
16. Se o workflow falhar, investigue e envie correções na mesma branch, sem forçar o merge.

O workflow do GitHub é a única autoridade responsável por integrar automaticamente branches `automation/artigo-*`.

## Segurança editorial

- Não invente fatos, fontes, datas, preços, citações ou disponibilidade.
- Não use imagens sem procedência e condição de uso identificáveis.
- Não publique rumores como fatos.
- Não altere o design global durante a rotina diária.
- Não exponha segredos, tokens, cookies ou dados pessoais.
- Preserve a estabilidade do site acima da quantidade de publicações.
