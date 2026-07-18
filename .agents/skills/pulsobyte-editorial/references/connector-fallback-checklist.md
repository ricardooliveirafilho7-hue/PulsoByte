# Checklist de CONNECTOR_FALLBACK

Use somente após três falhas locais causadas exclusivamente por DNS, rota, timeout ou conexão externa.

## Entrada

- GitHub lê e escreve no repositório.
- Vercel consulta o projeto.
- Branch padrão e SHA `sourceRevision` confirmados.
- Catálogo canônico integral disponível.
- `scripts/automation/prepare-connector-image.py` disponível.
- Processamento temporário de imagem disponível.

## Preparação

1. Ler todos os contratos e configurações na mesma `sourceRevision`.
2. Usar o catálogo como inventário completo; não reconstruir manualmente.
3. Preparar todos os arquivos antes de criar qualquer ref.
4. Baixar imagem da URL individual da origem licenciada.
5. Validar bytes, MIME e decodificação.
6. Executar o preparador portátil.
7. Reabrir o WebP e confirmar manifesto, dimensões, peso, SHA-256 e hash perceptual.
8. Converter o binário completo para base64.

## Escrita GitHub

1. Reconfirmar que a branch padrão continua em `sourceRevision`.
2. Criar blobs do MDX, capa, imagens internas e catálogo.
3. Criar árvore baseada na árvore de `sourceRevision`.
4. Criar um único commit com pai exato em `sourceRevision`.
5. Repetir idempotência e concorrência.
6. Criar branch editorial apontando para o commit pronto.
7. Ler a capa de volta pelo GitHub e confirmar bytes e SHA-256.
8. Conferir diff e allowlist.
9. Abrir PR não-draft.
10. Delegar checkout sintético, npm ci, validadores, build, Preview, merge preso ao SHA e smoke test ao GitHub Actions.

## Bloqueios

Bloquear quando:

- catálogo ou revisão-base não são íntegros;
- imagem não pode ser processada após três origens/opções reais;
- blob não pode ser lido de volta com o mesmo SHA;
- PR ou workflow não inicia;
- GitHub/Vercel permanecem indisponíveis;
- base mudou e não pode ser reconstruída com segurança.
