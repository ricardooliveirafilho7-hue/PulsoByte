# Acessibilidade — PulsoByte

Meta: **WCAG 2.2 AA** em todo o site, buscando AAA em foco, contraste do
conteúdo principal, legibilidade e navegação.

## O que já está implementado

- **Skip link** ("Pular para o conteúdo") como primeiro elemento focável.
- **Foco visível** de 2px na cor brand em todo elemento interativo
  (`:focus-visible` global), nunca escondido pelo header (que não é sticky).
- **Landmarks**: `header`, `main`, `aside`, `nav` e `footer` com
  `aria-label` quando há mais de um do mesmo tipo.
- **Hierarquia de headings**: um único `h1` por página; `h2`/`h3` no corpo.
  Headings nunca são usados só para mudar tamanho.
- **Menu mobile**: fecha com Escape, devolve o scroll, move o foco para o
  painel ao abrir, fecha ao navegar.
- **Painel de preferências**: radiogroups nativos (`fieldset`/`legend` +
  `input type=radio`), fecha com Escape e clique externo.
- **Alvos**: botões de ícone com 44×44px (`h-11 w-11`); alvos menores nunca
  abaixo de 24×24px.
- **Cor nunca é o único sinal**: editorias têm nome textual junto do acento;
  links do corpo são sublinhados; estados ativos combinam borda + peso.
- **Busca e índice funcionam sem JavaScript** (form GET, `<details>`); o
  destaque de seção ativa e as listas salvas são progressivos.
- **`prefers-reduced-motion`** respeitado globalmente + preferência manual
  "Movimento: Reduzido" no painel.
- **Dark mode** com contraste recalculado (tokens próprios, não inversão) e
  `color-scheme` declarado.
- **Zoom**: layout fluido com `clamp`/grids; corpo de artigo com largura em
  `rem`, tamanho de fonte ajustável no painel.
- **Imagens**: `alt` obrigatório no frontmatter (validado no build);
  decorativas com `alt` vazio e `aria-hidden` em ícones.
- **`aria-live`** somente na região de resultados de busca e no contador do
  checklist.

## Regras para novos componentes

1. HTML semântico antes de ARIA; ARIA só quando o HTML não resolve.
2. Toda interação por ponteiro tem equivalente por teclado; nada exclusivo
   de hover ou de arrastar.
3. Modais/menus: focus trap correto, Escape fecha, foco retorna ao gatilho.
4. Formulários com `label` visível ou `sr-only` + instruções claras.
5. Mensagens de erro específicas e associadas ao campo.
6. Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande e
   componentes de interface — nos dois temas.
7. Testar com teclado e com um leitor de tela (VoiceOver/NVDA/TalkBack) antes
   de publicar mudanças estruturais.

## Checklist de teste por release

- Larguras: 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920px.
- Navegação completa por Tab/Shift+Tab (ordem previsível, foco visível).
- Zoom 200% sem perda de conteúdo; leitura confortável até 400% nas páginas
  principais.
- `prefers-reduced-motion` e preferência manual.
- Dark mode manual e por sistema.
- Artigos legíveis com JavaScript desativado.
- Imagens desativadas: alts presentes e úteis.
