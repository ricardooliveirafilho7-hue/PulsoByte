# Execuções editoriais sequenciais

Este documento complementa e, quando houver conflito específico sobre quantidade por turno ou identidade de execução, substitui as regras antigas de limite de um artigo por turno presentes nos documentos editoriais anteriores.

## Regra

Cada execução continua limitada a exatamente um artigo novo. Porém, uma mesma data e um mesmo turno podem possuir várias execuções independentes, desde que não haja duplicidade material de pauta, `topicKey`, entidade, evento, pergunta central, título, slug, URL primária ou imagem.

## Identidade

A primeira execução de um turno usa:

```text
AAAA-MM-DD-morning
AAAA-MM-DD-evening
```

As seguintes usam sequência de dois dígitos:

```text
AAAA-MM-DD-morning-02
AAAA-MM-DD-morning-03
AAAA-MM-DD-evening-02
```

A sequência `-01` é inválida. A primeira execução nunca recebe sufixo.

## Branches

```text
automation/artigo-AAAA-MM-DD-manha-slug
automation/artigo-AAAA-MM-DD-manha-02-slug
automation/artigo-AAAA-MM-DD-noite-slug
automation/artigo-AAAA-MM-DD-noite-02-slug
```

## Idempotência e concorrência

A existência de outro artigo na mesma data ou no mesmo turno não bloqueia uma nova execução. O bloqueio ocorre apenas quando o `automationRunId` escolhido já foi consumido ou quando existe duplicidade material ou concorrência pelo mesmo número sequencial.

A seleção deve usar o menor número livre, sem lacunas. Antes da criação da branch, a automação precisa reconfirmar catálogo, branches e PRs para evitar corrida.

## Limites

- Um artigo por execução.
- Até 99 execuções por turno e data, conforme o intervalo de dois dígitos.
- Até 198 artigos automáticos por data somando manhã e noite.
- Os gates editoriais, de imagem, segurança e produção continuam obrigatórios; o aumento do limite não autoriza conteúdo fraco ou repetido.

## Validação

O validador deve:

1. aceitar a identidade sem sufixo para a primeira execução;
2. aceitar `-02` até `-99` para execuções adicionais;
3. rejeitar `-01`, sequências fora de ordem e lacunas;
4. exigir correspondência exata entre branch, data, turno, sequência, slug e `automationRunId`;
5. manter unicidade de `automationRunId`, `topicKey`, título e slug;
6. manter as verificações de fontes, profundidade, MDX e similaridade.
