# Verificação de Publicação

## Princípio
A existência de um deployment NÃO é publicação. A página precisa ser aberta e
conferida. "publicado_verificado" só depois disso.

## Passos (após a integração autorizada)
1. Identificar o commit integrado.
2. Confirmar sua presença na branch padrão.
3. Localizar o deployment correspondente (API da Vercel, por SHA).
4. Confirmar que o deployment usa o commit certo.
5. Aguardar readyState = READY (com timeout).
6. Abrir a URL real do artigo.
7. Confirmar resposta HTTP válida (200).
8. Verificar título, resumo e texto presentes.
9. Verificar imagem principal e adicionais carregando.
10. Verificar créditos e links.
11. Verificar presença no catálogo e navegação.
12. Verificar desktop e mobile (ao menos que a página responde e renderiza;
    checagem visual pixel-a-pixel é melhoria futura — ver automation/README).
13. Confirmar ausência de conteúdo quebrado.
14. Registrar a URL final no estado.

Rode `scripts/verify-publication.mjs` para as partes determinísticas
(deployment READY + HTTP 200 + presença do slug/título no HTML).

## Se falhar
Timeout ou página quebrada → estado `deployment_nao_verificado` (nunca
"publicado"). O relatório final diz exatamente o que faltou.
