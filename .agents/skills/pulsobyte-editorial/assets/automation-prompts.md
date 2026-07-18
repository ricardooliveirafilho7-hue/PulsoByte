# Prompts mínimos para as automações

## Manhã

Use a habilidade `pulsobyte-editorial` no modo `editorial` com `publicationSlot=morning`. Resolva a data em `America/Sao_Paulo`, calcule e valide a identidade pelo script da habilidade e execute o contrato completo. Produza no máximo um artigo. Não faça merge manual.

## Noite

Use a habilidade `pulsobyte-editorial` no modo `editorial` com `publicationSlot=evening`. Resolva a data em `America/Sao_Paulo`, calcule e valide a identidade pelo script da habilidade, confirme o estado da manhã e execute o contrato completo. Produza no máximo um artigo materialmente diferente da manhã. Não faça merge manual.

## Guardião

Use a habilidade `pulsobyte-editorial` no modo `guardian`. Atue somente em PRs `automation/artigo-*` recentes ou produção recém-integrada ainda não verificada. Respeite duas tentativas, corrija apenas os arquivos do mesmo PR e nunca faça merge.

## Teste manual

Use a habilidade `pulsobyte-editorial` no modo `manual-infra-test`. Verifique acessos, contratos, branch padrão, revisão-base, Node, npm, catálogo, validadores, workflow e Vercel. Não determine turno, não gere `automationRunId` e não escreva no repositório.
