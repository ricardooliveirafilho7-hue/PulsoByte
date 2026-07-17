import { site } from "@/config/site";

/**
 * Script global do Google AdSense.
 * Só é carregado quando houver um client configurado — com o valor vazio,
 * nada é adicionado à página.
 *
 * Usa uma tag <script async> nativa em vez de next/script: o React 19 eleva
 * scripts async com src para o <head> durante o SSR, então a tag aparece no
 * HTML final de todas as páginas (exigência do AdSense) uma única vez.
 */
export function AdsenseScript() {
  if (!site.adsenseClient) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsenseClient}`}
      crossOrigin="anonymous"
    />
  );
}
