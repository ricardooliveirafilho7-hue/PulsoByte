# Prompts Operacionais — PulsoByte Editorial

Use estes prompts curtos para disparar a execução. As regras permanentes vivem
na skill `pulsobyte-editorial-chatgpt` — o prompt NÃO repete o contrato.

## Turno da manhã (morning)

    Use a habilidade `pulsobyte-editorial-chatgpt` no modo `editorial` com
    `publicationSlot=morning` para executar o turno matinal da PulsoByte no
    repositório `ricardooliveirafilho7-hue/PulsoByte`.

    Resolva a data editorial em `America/Sao_Paulo`, valide o `automationRunId`,
    siga integralmente a Skill, leia o repositório antes de decidir, produza no
    máximo um artigo, abra um único Pull Request e encerre somente com o
    relatório oficial da execução. Não faça merge.

## Turno da noite (evening)

    Use a habilidade `pulsobyte-editorial-chatgpt` no modo `editorial` com
    `publicationSlot=evening` para executar o turno noturno da PulsoByte no
    repositório `ricardooliveirafilho7-hue/PulsoByte`.

    Resolva a data editorial em `America/Sao_Paulo`, valide o `automationRunId`,
    siga integralmente a Skill, leia o repositório antes de decidir, produza no
    máximo um artigo, abra um único Pull Request e encerre somente com o
    relatório oficial da execução. Não faça merge.

## Retomada (resume)

    Use a habilidade `pulsobyte-editorial-chatgpt` no modo `resume` com
    `publicationSlot=<morning|evening>` e o mesmo `automationRunId` da execução
    interrompida. Localize branch/commit/PR existentes, continue da última etapa
    concluída, e encerre com o relatório. Nunca crie outro artigo/branch/PR.
