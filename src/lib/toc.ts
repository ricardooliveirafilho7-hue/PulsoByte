import GithubSlugger from "github-slugger";

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extrai h2/h3 do MDX bruto, ignorando blocos de código.
 * Os IDs seguem o mesmo algoritmo do rehype-slug (github-slugger),
 * então os links do índice apontam para os títulos renderizados.
 */
export function getTableOfContents(mdx: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const withoutCode = mdx.replace(/```[\s\S]*?```/g, "");
  const entries: TocEntry[] = [];

  for (const match of withoutCode.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const level = match[1]?.length === 2 ? 2 : 3;
    const text = (match[2] ?? "").replace(/[*_`]/g, "").trim();
    entries.push({ id: slugger.slug(text), text, level });
  }

  return entries;
}
