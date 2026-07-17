# Fallback operacional pelo conector GitHub

Este documento complementa a seção 6 do `Plano_Automacao_PulsoByte_2x_Dia.md` e se aplica somente quando o clone ou `git worktree` falhar por problema externo de DNS, rota ou conectividade do ambiente de execução.

O objetivo é impedir que uma indisponibilidade exclusiva do terminal desperdice um turno quando os conectores GitHub e Vercel continuam acessíveis. O modo continua fail-closed: ele não reduz exigências editoriais e transfere as validações dependentes do repositório completo para o GitHub Actions, que testa o merge sintético.

## 1. Quando o fallback pode ser ativado

Ative `CONNECTOR_FALLBACK` apenas quando todas as condições forem verdadeiras:

1. o clone limpo falhou em três tentativas, com espera progressiva;
2. a falha é externa e transitória, como `Could not resolve host: github.com`, timeout de rota ou conexão recusada;
3. o conector GitHub consegue acessar o repositório, descobrir a branch padrão e ler arquivos;
4. o conector Vercel consegue consultar o projeto;
5. a API do GitHub permite criar branch, commit e PR;
6. é possível inventariar integralmente os artigos, branches e PRs relevantes antes de escrever.

Não use o fallback para erro de autenticação, permissão, repositório inexistente, contrato ausente, conteúdo inconsistente ou falha dos validadores. Nesses casos, encerre com o bloqueio específico.

## 2. Fonte de verdade e revisão base

Ao entrar em `CONNECTOR_FALLBACK`:

1. descubra a branch padrão pela API;
2. registre o SHA exato da ponta como `sourceRevision`;
3. crie qualquer branch editorial exatamente a partir desse SHA;
4. leia pelo conector, na `sourceRevision`, pelo menos:
   - `AGENTS.md`;
   - `README.md`;
   - `package.json` e lockfile;
   - `.nvmrc`;
   - `docs/Plano_Automacao_PulsoByte_2x_Dia.md`;
   - este documento;
   - schemas e configurações editoriais;
   - componentes MDX registrados;
   - scripts de validação;
   - `.github/workflows/automated-content.yml`;
   - todos os arquivos em `content/articles/`;
   - metadados e nomes das imagens editoriais existentes.

Se não for possível enumerar e ler integralmente o acervo necessário, encerre `BLOCKED_INFRASTRUCTURE`. Não trabalhe com inventário parcial.

## 3. Idempotência no modo conector

Execute a mesma trava do modo local, consultando pela API e pelos conectores:

- `automationRunId`;
- data e `publicationSlot`;
- slug e título normalizado;
- `topicKey`;
- entidade, produto, evento ou pergunta central;
- URL primária;
- branches remotas;
- PRs abertos, fechados e integrados;
- execução da manhã quando o turno for noturno.

Repita a trava imediatamente antes de criar a branch e imediatamente antes de gravar o commit final. Se a branch padrão tiver saído de `sourceRevision`, refaça o inventário e a seleção ou encerre `BLOCKED_CONCURRENCY`.

## 4. Preparação do artigo e das imagens

O artigo e os ativos podem ser preparados em diretório temporário sem checkout Git, desde que sejam preservadas todas as regras do plano.

Antes do envio, valide de forma independente tudo o que não depende de `node_modules`:

- frontmatter obrigatório;
- correspondência entre slug, nome do MDX e nome da capa;
- identidade do turno;
- componentes MDX conforme a lista registrada lida da branch padrão;
- links internos contra o inventário completo;
- URLs de fontes;
- contagem e profundidade editorial;
- WebP verdadeiro;
- dimensões, proporção e tamanho;
- SHA-256 e comparação com hashes existentes;
- créditos, origem, licença, legenda, alt e ponto focal;
- ausência de metadados pessoais;
- exatamente um artigo novo, uma capa nova e até três imagens internas realmente usadas.

Arquivos de texto devem ser enviados pela API de conteúdos. Arquivos binários devem ser enviados como blobs em base64 e incorporados por árvore/commit. Nunca tente representar imagem como texto UTF-8.

## 5. Branch, commit e PR

1. crie `automation/artigo-AAAA-MM-DD-manha-slug` ou `automation/artigo-AAAA-MM-DD-noite-slug` a partir de `sourceRevision`;
2. grave apenas os arquivos permitidos;
3. confira pela API o diff final e a allowlist;
4. abra PR não-draft contra a branch padrão descoberta;
5. não faça merge manual e não habilite auto-merge no PR;
6. aguarde o workflow `Automated content quality and merge`.

No modo conector, o GitHub Actions é a autoridade para as verificações que exigem checkout completo:

- checkout do merge sintético;
- Node da versão do repositório;
- `npm ci`;
- `validate:content`;
- `validate:images`;
- `typecheck`;
- `lint`;
- `build`;
- `git diff --check`;
- Preview da Vercel;
- merge preso ao SHA validado;
- smoke test de produção.

O turno só pode terminar como publicado depois que essas etapas passarem. A ausência de validação local completa não pode ser descrita como sucesso antecipado.

## 6. Correções e limites

Quando o workflow falhar:

- leia os jobs e logs pela API;
- faça no máximo três ciclos de correção;
- altere somente os arquivos já criados pelo mesmo PR;
- repita a trava de base e idempotência antes de cada atualização;
- não desabilite validações.

Depois de três ciclos, encerre `BLOCKED_VALIDATION`.

## 7. Quando ainda bloquear

Encerre `BLOCKED_INFRASTRUCTURE` se ocorrer qualquer uma destas situações:

- clone falha e o conector GitHub também não consegue ler ou escrever;
- inventário completo não pode ser obtido;
- branch padrão ou SHA não podem ser confirmados;
- não é possível enviar a imagem binária corretamente;
- o PR não pode ser aberto;
- o GitHub Actions não inicia após consultas repetidas;
- Vercel ou GitHub permanecem indisponíveis;
- a branch padrão muda e não é possível reconstruir com segurança.

Uma falha de DNS limitada ao terminal, com GitHub e Vercel acessíveis pelos conectores, não deve mais bloquear automaticamente o turno.
