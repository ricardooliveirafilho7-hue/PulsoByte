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
7. Altere somente um novo artigo, sua capa e até três imagens internas justificadas.
8. Execute `npm run validate:content`, `npm run validate:images`, `npm run typecheck`, `npm run lint` e `npm run build` antes de enviar a branch.
9. Abra um Pull Request não marcado como draft contra a branch padrão.
10. Não faça push direto na branch padrão.
11. Não execute `gh pr merge`, `gh pr merge --auto`, `merge_pull_request` ou qualquer comando equivalente.
12. Não habilite auto-merge diretamente no Pull Request.
13. Não tente aprovar o próprio Pull Request, ignorar checks, usar `--admin`, alterar rulesets ou contornar proteções.
14. Após abrir o Pull Request, encerre a parte de escrita e deixe o workflow `.github/workflows/automated-content.yml` executar os checks, aguardar a Vercel e realizar o squash merge automaticamente.
15. Se o workflow falhar, investigue e envie correções na mesma branch, sem forçar o merge.

O workflow do GitHub é a única autoridade responsável por integrar automaticamente branches `automation/artigo-*`.

## Segurança editorial

- Não invente fatos, fontes, datas, preços, citações ou disponibilidade.
- Não use imagens sem procedência e condição de uso identificáveis.
- Não publique rumores como fatos.
- Não altere o design global durante a rotina diária.
- Não exponha segredos, tokens, cookies ou dados pessoais.
- Preserve a estabilidade do site acima da quantidade de publicações.
