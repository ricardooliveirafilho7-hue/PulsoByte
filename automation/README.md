# Automação Editorial PulsoByte — Operação

Este diretório contém a automação editorial da PulsoByte. A lógica editorial
vive na skill `.claude/skills/pulsobyte-editorial-chatgpt/`. Aqui ficam a
configuração, os scripts de estado e a documentação de operação.

## Componentes

- **Skill** (`.claude/skills/pulsobyte-editorial-chatgpt/`): contrato editorial,
  referências, templates e scripts determinísticos.
- **Workflow** (`.github/workflows/pulsobyte-editorial.yml`): agenda os turnos
  (06:00 e 20:00 America/Sao_Paulo) e orquestra a execução.
- **Config** (`automation/config/pulsobyte.config.json`): fonte única de
  configuração. Ajuste os campos marcados com 🔍 ao repositório real.
- **Estado** (`automation/state/execucoes.jsonl`): registro append-only de cada
  execução. É a "tabela de controle" — GitHub como fonte de verdade, sem SQL.

## Secrets necessários (Settings > Secrets and variables > Actions)

| Secret | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | rodar o Claude Code dentro do workflow |
| `VERCEL_TOKEN` | verificar deployment (script verify-publication) |
| `VERCEL_PROJECT_ID` | idem |
| `VERCEL_TEAM_ID` | opcional, se o projeto estiver num time da Vercel |

O `GITHUB_TOKEN` já é fornecido nativamente pelo Actions — não precisa criar.

## Como rodar manualmente

Actions > "PulsoByte Editorial" > Run workflow. Escolha o turno (ou deixe vazio
para inferir pela hora) e o modo. Acompanhe os logs.

## Estados da execução

`execucao_iniciada` → `pesquisa_concluida` → `artigo_criado` →
`validacoes_aprovadas` → `pr_aberto` → `integrado` → `deployment_concluido` →
`publicado_verificado`.

Mais: `bloqueado_turno_ja_executado`, `falhou_validacao`, `deployment_nao_verificado`.

## Recuperação (execução interrompida)

Rode o workflow com `mode=resume` e o mesmo turno. A skill localiza a branch/PR
existentes pelo `automationRunId` e continua de onde parou — nunca cria outro
artigo/branch/PR.

## Verificação de publicação

Só acontece DEPOIS do merge autorizado. Use o job `verify` (comentado no
workflow) ou rode localmente:

    node .claude/skills/pulsobyte-editorial-chatgpt/scripts/verify-publication.mjs \
      --sha <SHA_integrado> --url <url_do_artigo> --slug <slug> --title "<Título>"

## Antes de ir para produção (checklist 🔍)

- [ ] `contentGlobs` aponta para os artigos reais
- [ ] `articleSchema` reflete o frontmatter real
- [ ] `imagePolicy.publicDir` e formato conferem
- [ ] `commands` batem com o package.json
- [ ] `.nvmrc` existe (ou ajustar node-version no workflow)
- [ ] Secrets configurados
- [ ] Primeira execução feita via workflow_dispatch e acompanhada de ponta a ponta

## Melhorias futuras (fora do MVP)

- Verificação visual desktop/mobile com screenshot (Playwright).
- Job automático de verificação disparado no merge do PR.
- Auto-merge após X horas sem objeção, se desejado.
