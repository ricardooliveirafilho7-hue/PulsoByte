import Script from "next/script";
import { site } from "@/config/site";

/**
 * Script global do Google AdSense.
 * Só é carregado quando NEXT_PUBLIC_ADSENSE_CLIENT estiver definido —
 * com a variável vazia, nada é adicionado à página.
 */
export function AdsenseScript() {
  if (!site.adsenseClient) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsenseClient}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
