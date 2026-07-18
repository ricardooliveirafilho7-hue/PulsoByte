# Estados oficiais

## Progresso

- `SCHEDULED`
- `LOCKED`
- `RESEARCHED`
- `SELECTED`
- `DRAFTED`
- `VALIDATED`
- `PR_OPEN`
- `CI_RUNNING`
- `PREVIEW_READY`
- `MERGED`
- `PROD_READY`
- `VERIFIED`

## Encerramento seguro

- `SKIPPED_NO_STRONG_TOPIC`: nenhuma pauta passou todos os gates.
- `BLOCKED_VALIDATION`: identidade, conteúdo, imagem ou testes inválidos.
- `BLOCKED_DUPLICATE`: turno, pauta ou identidade já consumidos.
- `BLOCKED_CONCURRENCY`: revisão-base mudou ou execução conflitante.
- `BLOCKED_CANONICAL_DOCUMENT`: contrato obrigatório indisponível ou incompleto.
- `BLOCKED_SOURCE`: evidência factual insuficiente ou contraditória.
- `BLOCKED_IMAGE`: nenhuma imagem segura e tecnicamente válida.
- `BLOCKED_ACCESS`: autenticação ou permissão insuficiente.
- `BLOCKED_INFRASTRUCTURE`: pré-requisito estrutural ausente ou serviço essencial indisponível.
- `GUARDIAN_EXHAUSTED`: duas tentativas do guardião não resolveram.

`VERIFIED` só pode ser usado depois de confirmar a produção pública. PR aberto ou CI verde ainda não é publicação confirmada.
