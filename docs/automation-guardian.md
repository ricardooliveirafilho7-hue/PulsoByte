# Automação guardiã — sinais, limites e recuperação

Contrato curto para a futura automação guardiã (verificação horária). Ela **ainda não foi criada**; este documento existe para que, quando for ativada, opere sem duplicar publicações nem contornar validações. Os valores numéricos vêm de `automation/editorial-config.json` (`limits.maxGuardianAttempts`, `limits.maxBaseRevalidations`).

## Sinais que a guardiã consulta

1. PRs `automation/artigo-*` atualizados nas últimas 6 horas;
2. execuções do workflow `Automated content quality and merge` (pendentes, falhas, canceladas);
3. estado do `automationRunId` do turno corrente e do anterior: `node scripts/automation/run-state.mjs <runId>`;
4. deploy de produção da Vercel para o SHA integrado;
5. smoke test: `npm run smoke:production -- --slug <slug>`.

Se tudo estiver saudável, encerra silenciosamente.

## Estados recuperáveis (a guardiã pode agir)

- `PR_OPEN_CI_FAILED` por conteúdo, imagem ou manifesto desatualizado → corrigir **na mesma branch do mesmo PR**, regenerar o catálogo, revalidar e enviar;
- falha transitória de infraestrutura (timeout, HTTP 5xx, runner) → aguardar com backoff e repetir uma vez;
- `MERGE_ABORTED_REVALIDATION_EXHAUSTED` / base avançou → o próprio workflow revalida em novos eventos; a guardiã apenas dispara um novo evento (ex.: rebase da branch do PR) e acompanha;
- `MERGED_AWAITING_PRODUCTION` → aguardar deploy e rodar o smoke test.

## Estados NÃO recuperáveis (bloquear e relatar; nunca contornar)

- falha de fonte, contradição factual ou disponibilidade não confirmada (não "reescrever para passar");
- `MERGE_ABORTED_CONFLICT` (conflito editorial exige decisão humana);
- problema de permissão, token, ruleset ou branch protection;
- segredo, licença ambígua ou dado pessoal no diff;
- `ABANDONED` (branch antiga sem PR).

## Limites de ação

- no máximo **2** tentativas da guardiã por PR; depois, `GUARDIAN_EXHAUSTED` com relatório;
- toda correção roda a suíte completa e permanece nos arquivos já criados pelo mesmo PR;
- a guardiã **nunca** faz merge, aprova PR, usa `--admin`, altera ruleset ou publica manualmente na Vercel;
- a guardiã não é mecanismo para contornar validações: se o workflow bloqueou por regra, a regra prevalece.

## Quando atualizar a mesma branch × quando apenas aguardar × quando encerrar

- **Atualizar a mesma branch:** CI falhou por causa corrigível dentro da allowlist do PR;
- **Aguardar:** CI em andamento, merge serializado em fila, Preview/produção da Vercel pendente sem erro;
- **Encerrar:** estado não recuperável, duas tentativas esgotadas, ou o turno seguinte (20:30/06:00) está a menos de 1 hora — nunca deixar dois turnos disputando a mesma janela.

## Como reconhecer produção concluída

1. PR integrado (squash) e branch removida;
2. deploy de produção do commit de merge em `READY` na Vercel;
3. `npm run smoke:production -- --slug <slug>` aprovado (HTTP 200, canonical/og:url/JSON-LD exatos, capa WebP, sitemap e robots no host canônico).

Só então o `automationRunId` está `VERIFIED`.

## Como evitar duplicidade

Antes de qualquer ação, rodar `run-state.mjs` e obedecer à ação retornada. Nunca criar segunda branch, segundo PR ou segundo artigo para o mesmo `automationRunId` — o workflow também bloqueia esses casos de forma independente (defesa em profundidade).

## Formato do relatório de cada intervenção

```text
runId: 2026-07-18-morning
estado-encontrado: PR_OPEN_CI_FAILED
tentativa: 1/2
causa: <job e mensagem exata do CI>
acao: <o que foi alterado, arquivos e commit>
resultado: <estado final após a ação>
proximo-passo: <aguardar | nova tentativa | GUARDIAN_EXHAUSTED>
```

O relatório é publicado como comentário legível no PR, com o `automationRunId` sempre presente.
