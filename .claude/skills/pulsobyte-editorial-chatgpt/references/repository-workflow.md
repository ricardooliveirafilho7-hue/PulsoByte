# Fluxo no Repositório (Git, Branch, PR)

## Inserção
Crie o artigo no local e formato corretos. Atualize APENAS o necessário: MDX,
catálogo/índice/manifesto/lista, imagens, metadados relacionados. Não reorganize
o projeto, não mexa em componentes/dependências/config sem necessidade direta.

Confirme antes do commit: slug único, título consistente, data e turno corretos,
automationRunId correto, topicKey único, categoria permitida, tags válidas,
autor válido, caminho das imagens, créditos, links, imports, componentes MDX,
sintaxe e ordenação no catálogo.

## Branch (uma só)
`automation/artigo-AAAA-MM-DD-manha-<slug>` (morning) ou
`automation/artigo-AAAA-MM-DD-noite-<slug>` (evening).
Execução iniciada continua na MESMA branch. Nunca outra branch pro mesmo turno.

## Commit
1 branch → adicionar só os arquivos relacionados → revisar `git status` →
revisar diff → confirmar ausência de credenciais → confirmar ausência de
temporários → confirmar que nada fora do artigo mudou → commit claro → push.
Mensagem: `feat(content): publica artigo sobre <tema>` (adaptar ao histórico real).

## Pull Request (um só)
Título: `[PulsoByte Editorial][AAAA-MM-DD-morning] <Título>` (ou `-evening`).
Corpo: usar `templates/pull-request-template.md` (todos os campos).
Nome da automação: "PulsoByte Editorial".
Nunca abra 2 PRs pro mesmo automationRunId. Se já existe, use o mesmo.
A skill NÃO faz merge, NÃO habilita auto-merge, NÃO publica direto na Vercel.

## Acompanhamento
Verifique checks iniciados, workflows associados, resultado das validações,
comentários automatizados, revisão e estado de integração. Alterações da mesma
publicação ficam na mesma branch/PR. Confirme que o conteúdo integrado é o mesmo
artigo validado.
