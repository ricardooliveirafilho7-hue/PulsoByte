/**
 * Tokens de design consumidos pelos componentes.
 * As cores em si vivem em src/app/globals.css (variáveis CSS com variantes
 * clara/escura); aqui ficam os mapeamentos semânticos — por exemplo, qual
 * acento cada editoria usa. A cor nunca é o único identificador: ela sempre
 * acompanha o nome da editoria em texto.
 */

export interface CategoryAccent {
  /** Texto do acento (etiquetas, kickers). Versão escura da cor. */
  text: string;
  /** Borda/indicador lateral. */
  border: string;
  /** Fundo discreto (versão clara da cor). */
  bg: string;
}

const accents = {
  brand: { text: "text-brand", border: "border-brand", bg: "bg-brand-soft" },
  violet: { text: "text-violet", border: "border-violet", bg: "bg-violet-soft" },
  green: { text: "text-green", border: "border-green", bg: "bg-green-soft" },
  amber: { text: "text-amber", border: "border-amber", bg: "bg-amber-soft" },
  red: { text: "text-red", border: "border-red", bg: "bg-red-soft" },
  brandDark: { text: "text-brand-dark", border: "border-brand-dark", bg: "bg-brand-faint" },
} as const satisfies Record<string, CategoryAccent>;

/** Acento por editoria — ver docs/editorial-design-system.md. */
const categoryAccents: Record<string, CategoryAccent> = {
  "inteligencia-artificial": accents.violet,
  aplicativos: accents.brand,
  tecnologia: accents.brand,
  "negocios-digitais": accents.amber,
  guias: accents.green,
  comparativos: accents.red,
  noticias: accents.brandDark,
};

export function getCategoryAccent(categorySlug: string): CategoryAccent {
  return categoryAccents[categorySlug] ?? accents.brand;
}
