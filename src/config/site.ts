import editorialConfig from "../../automation/editorial-config.json";

/**
 * Resolve a URL pública canônica do portal.
 *
 * Regras:
 * - `NEXT_PUBLIC_SITE_URL` definida e não vazia: precisa ser uma URL válida,
 *   HTTPS (HTTP é aceito apenas para localhost/127.0.0.1 em desenvolvimento),
 *   sem caminho, query ou fragmento. Valor inválido interrompe o build — nunca
 *   caímos silenciosamente em outro domínio.
 * - Variável ausente ou vazia: usa o domínio de produção confirmado em
 *   `automation/editorial-config.json` (`site.productionUrl`). A troca para o
 *   domínio personalizado é uma única configuração — ver README, seção
 *   "Como preencher o domínio".
 * - A barra final é sempre removida (retornamos `origin`).
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = raw && raw !== "" ? raw : editorialConfig.site.productionUrl;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL inválida: "${candidate}". Use uma URL completa, por exemplo https://pulso-byte.vercel.app.`
    );
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const isLocal = localHosts.has(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocal)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL precisa usar HTTPS em produção (recebido: "${candidate}"). HTTP é permitido apenas para localhost.`
    );
  }
  if ((parsed.pathname !== "/" && parsed.pathname !== "") || parsed.search || parsed.hash) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL não pode conter caminho, query ou fragmento (recebido: "${candidate}").`
    );
  }

  return parsed.origin;
}

/**
 * Resolve o ID de editor do Google AdSense.
 *
 * Política (documentada no README):
 * - variável ausente: usa o ID padrão do portal (o AdSense fica ativo);
 * - variável definida como string vazia: AdSense completamente desativado;
 * - variável definida: precisa seguir o formato `ca-pub-<dígitos>`; um valor
 *   fora do formato interrompe o build em vez de carregar um script inválido.
 *
 * O publisher ID não é um segredo (ele aparece no HTML público e no ads.txt),
 * mas precisa manter coerência com `public/ads.txt`.
 */
const DEFAULT_ADSENSE_CLIENT = "ca-pub-8659303689605234";

function resolveAdsenseClient(): string {
  const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (raw === undefined) return DEFAULT_ADSENSE_CLIENT;
  const value = raw.trim();
  if (value === "") return "";
  if (!/^ca-pub-\d{10,20}$/.test(value)) {
    throw new Error(
      `NEXT_PUBLIC_ADSENSE_CLIENT inválido: "${value}". Use o formato ca-pub-0000000000000000 ou deixe vazio para desativar.`
    );
  }
  return value;
}

export const site = {
  name: "PulsoByte",
  slogan: "Tecnologia sem ruído.",
  description:
    "O PulsoByte explica tecnologia sem ruído: o que mudou, por que importa, como funciona e qual opção escolher. Inteligência artificial, aplicativos, guias, comparativos e negócios digitais.",
  url: resolveSiteUrl(),
  locale: "pt-BR",
  author: "Redação PulsoByte",
  email: "contato@pulsobyte.com.br",
  adsenseClient: resolveAdsenseClient(),
  articlesPerPage: 12,
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
