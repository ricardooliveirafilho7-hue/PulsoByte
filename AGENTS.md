# Instruções para agentes no PulsoByte

Estas regras se aplicam a qualquer agente que trabalhe neste repositório.

## Automação editorial diária

Quando a tarefa for criar o artigo automático diário:

1. Sincronize-se com a branch padrão antes de começar.
2. Crie uma branch com o padrão `automation/artigo-AAAA-MM-DD-slug`.
3. Produza no máximo um artigo por dia.
4. Altere somente os arquivos necessários ao artigo, às imagens e aos índices já exigidos pelo projeto.
5. Execute `npm run validate:images`, `npm run typecheck`, `npm run lint` e `npm run build` antes de enviar a branch.
6. Abra um Pull Request não marcado como draft contra a branch padrão.
7. Não faça push direto na branch padrão.
8. Não execute `gh pr merge`, `gh pr merge --auto`, `merge_pull_request` ou qualquer comando equivalente.
9. Não habilite auto-merge diretamente no Pull Request.
10. Não tente aprovar o próprio Pull Request, ignorar checks, usar `--admin`, alterar rulesets ou contornar proteções.
11. Após abrir o Pull Request, encerre a parte de escrita e deixe o workflow `.github/workflows/automated-content.yml` executar os checks, aguardar a Vercel e realizar o squash merge automaticamente.
12. Se o workflow falhar, investigue e envie correções na mesma branch, sem forçar o merge.

O workflow do GitHub é a única autoridade responsável por integrar automaticamente branches `automation/artigo-*`.

## Segurança editorial

- Não invente fatos, fontes, datas, preços, citações ou disponibilidade.
- Não use imagens sem procedência e condição de uso identificáveis.
- Não publique rumores como fatos.
- Não altere o design global durante a rotina diária.
- Não exponha segredos, tokens, cookies ou dados pessoais.
- Preserve a estabilidade do site acima da quantidade de publicações.
