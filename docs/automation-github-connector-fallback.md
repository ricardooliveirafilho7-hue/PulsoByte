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
   - `automation/editorial-config.json` (fonte única de valores);
   - **`automation/editorial-catalog.json` (manifesto editorial)** — este arquivo único, gerado e determinístico, contém o inventário completo do acervo: slugs, títulos normalizados, datas, turnos, `automationRunId`, `topicKey`, entidades, intenções, fontes, hashes SHA-256 e perceptuais das capas e imagens internas. **O fallback não precisa listar a árvore do repositório**;
   - `docs/Plano_Automacao_PulsoByte_2x_Dia.md`;
   - este documento;
   - `scripts/automation/prepare-connector-image.py`;
   - componentes MDX registrados (`src/components/mdx/MdxContent.tsx`);
   - scripts de validação;
   - `.github/workflows/automated-content.yml`;
   - o texto integral apenas dos artigos de que a pauta depender (links internos, comparação fina), identificados pelo catálogo.

O inventário para as travas de duplicidade e diversidade vem do catálogo. Se o catálogo não puder ser lido na `sourceRevision`, ou se `npm run validate:catalog` estiver falhando na branch padrão, encerre `BLOCKED_INFRASTRUCTURE`. Não trabalhe com inventário parcial nem reconstruído manualmente.

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

O artigo e os ativos devem ser preparados em diretório temporário do ambiente de execução, sem exigir checkout Git. Falha de DNS para `github.com` não impede download de uma origem editorial HTTPS acessível nem processamento local de bytes.

### 4.1 Pipeline portátil obrigatório

1. leia `scripts/automation/prepare-connector-image.py` pelo conector na `sourceRevision` e grave uma cópia temporária;
2. grave também o catálogo canônico, sem alterações, em arquivo temporário;
3. baixe a imagem diretamente da página/origem licenciada, nunca de resultados de busca;
4. valide que a resposta possui bytes não vazios e formato de imagem reconhecido;
5. execute o preparador portátil com Python e Pillow;
6. aceite o arquivo somente se o comando terminar com código zero e produzir manifesto JSON;
7. leia novamente o WebP gerado, compare seu SHA-256 com o manifesto e só então converta os bytes completos para base64;
8. após o upload, leia o blob de volta pelo GitHub e confirme bytes e SHA-256 antes de abrir o PR.

Exemplo:

```bash
python prepare-connector-image.py \
  --input origem.jpg \
  --output capa.webp \
  --catalog editorial-catalog.json \
  --manifest capa.manifest.json \
  --source-url 'https://origem.example/imagem-individual' \
  --license 'Licença verificada'
```

O utilitário executa crop central 16:9, gera WebP 1600x900, limita o arquivo a 512.000 bytes, remove metadados incorporados, reabre a saída, calcula SHA-256 e aHash 64 bits e bloqueia duplicidade byte a byte ou perceptual contra o catálogo.

Se Pillow não estiver disponível, pode ser instalado apenas no diretório temporário da execução. Isso não altera dependências do repositório. ImageMagick ou Sharp também podem ser usados, desde que produzam o mesmo conjunto de verificações e um manifesto equivalente.

A inexistência de checkout local, por si só, **não autoriza `BLOCKED_INFRASTRUCTURE`** quando o conector consegue ler o preparador, o catálogo e enviar blobs, e o ambiente consegue processar arquivos temporários.

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
- hash perceptual e distância contra o catálogo;
- créditos, origem, licença, legenda, alt e ponto focal;
- ausência de metadados pessoais;
- exatamente um artigo novo, uma capa nova e até três imagens internas realmente usadas.

Arquivos de texto devem ser enviados pela API de conteúdos. Arquivos binários devem ser enviados como blobs em base64 e incorporados por árvore/commit. Nunca tente representar imagem como texto UTF-8.

## 5. Branch, commit e PR

1. prepare **todos** os arquivos antes de criar qualquer ref;
2. reconfirme que a branch padrão continua exatamente em `sourceRevision`;
3. crie blobs para o MDX, a capa, imagens internas e catálogo;
4. crie uma árvore baseada exatamente na árvore de `sourceRevision`;
5. crie um único commit cujo pai seja exatamente `sourceRevision`;
6. reconfirme a base e a idempotência;
7. crie `automation/artigo-AAAA-MM-DD-manha-slug`, `automation/artigo-AAAA-MM-DD-manha-02-slug` ou equivalente noturno apontando diretamente para o commit já pronto;
8. leia a capa de volta pelo GitHub e confira bytes e SHA-256;
9. confira pela API o diff final e a allowlist;
10. abra PR não-draft contra a branch padrão descoberta;
11. não faça merge manual e não habilite auto-merge no PR;
12. aguarde o workflow `Automated content quality and merge`.

Grave apenas os arquivos permitidos: um `.mdx`, uma capa, até três imagens internas usadas e `automation/editorial-catalog.json` regenerado. No modo conector, o registro novo do catálogo deve usar os mesmos campos, ordenação e serialização do gerador oficial; o CI confere com `validate:catalog`.

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
- nenhuma origem de imagem pode ser baixada após três opções e tentativas;
- o preparador não consegue produzir WebP válido, exclusivo e dentro dos limites;
- o blob binário não pode ser enviado ou lido de volta com o mesmo SHA-256;
- o PR não pode ser aberto;
- o GitHub Actions não inicia após consultas repetidas;
- Vercel ou GitHub permanecem indisponíveis;
- a branch padrão muda e não é possível reconstruir com segurança.

Uma falha de DNS limitada ao clone, com GitHub e Vercel acessíveis pelos conectores e processamento temporário funcional, não deve bloquear o turno.