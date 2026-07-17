# Performance — PulsoByte

## Metas (produção, percentil 75)

| Métrica | Meta pública | Meta interna |
| --- | --- | --- |
| LCP | ≤ 2.5s | ≤ 2.0s em páginas de artigo |
| INP | ≤ 200ms | ≤ 150ms |
| CLS | ≤ 0.1 | ≤ 0.05 |

## Como o site se mantém rápido

- **Server Components por padrão.** `"use client"` existe apenas em:
  navegação ativa (`DesktopNav`), menu mobile, barra de progresso, share
  rail, índice ativo, painel de preferências, salvar artigo/lista de salvos
  e checklist de guia. Todos pequenos e isolados — o conteúdo editorial não
  hidrata nada.
- **Conteúdo estático**: todas as rotas de artigo/categoria são SSG
  (`generateStaticParams`); a busca é a única rota dinâmica.
- **Imagens** via `next/image` (AVIF/WebP), `sizes` explícito por variante,
  `priority` apenas na imagem LCP (manchete da capa e imagem de abertura do
  artigo), proporções reservadas com `aspect-*` — zero layout shift.
- **Fontes** via `next/font` (self-host automático, `font-display: swap`,
  subsets latinos).
- **Sem bibliotecas pesadas**: nenhuma lib de animação, busca ou estado;
  interações usam CSS e APIs nativas (IntersectionObserver, localStorage).
- **Tema sem flash**: script inline mínimo aplica o data-theme antes da
  primeira pintura.
- **AdSense**: nada é carregado sem `NEXT_PUBLIC_ADSENSE_CLIENT`; com a
  variável, o script entra `afterInteractive` e os slots reservam espaço.

## Regras para mudanças futuras

1. Novo componente interativo? Justifique o `"use client"` e mantenha-o
   folha (não envolva children estáticos).
2. Nada de dependência nova sem medir o custo no bundle (`next build` mostra
   o First Load JS por rota — hoje ~102kB compartilhado).
3. Embeds (vídeo, mapas) só carregam após interação, com thumbnail estática.
4. Reserve dimensões de qualquer mídia/anúncio antes do carregamento.
5. Valide em rede lenta e mobile antes de publicar mudanças de layout.
6. Rode `npm run build` — o orçamento é o build limpo com validação de
   imagens (`validate:images`) verde.
