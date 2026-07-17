export const site = {
  name: "PulsoByte",
  slogan: "Tecnologia sem ruído.",
  description:
    "O PulsoByte explica tecnologia sem ruído: o que mudou, por que importa, como funciona e qual opção escolher. Inteligência artificial, aplicativos, guias, comparativos e negócios digitais.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pulsobyte.com.br",
  locale: "pt-BR",
  author: "Redação PulsoByte",
  email: "contato@pulsobyte.com.br",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-8659303689605234",
  articlesPerPage: 12,
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
