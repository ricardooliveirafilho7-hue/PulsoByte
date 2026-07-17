import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { categories, getCategory } from "@/config/categories";
import { contentTypeLabels, contentTypes } from "@/config/editorial";
import { searchArticles, type Article } from "@/lib/articles";
import { formatDate } from "@/lib/format";
import { ArticleImage } from "@/components/ArticleImage";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Buscar artigos",
  description:
    "Busque artigos do PulsoByte por título, tema, categoria ou tag — tecnologia sem ruído.",
  alternates: { canonical: "/buscar" },
  robots: { index: false },
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Destaca os termos buscados no texto, ignorando acentos e caixa. */
function highlight(text: string, terms: string[]): ReactNode {
  if (terms.length === 0) return text;
  const normalized = normalize(text);
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let start = 0;
    while (true) {
      const index = normalized.indexOf(term, start);
      if (index === -1) break;
      ranges.push([index, index + term.length]);
      start = index + term.length;
    }
  }
  if (ranges.length === 0) return text;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  const parts: ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([start, end], index) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={index} className="bg-brand-soft text-inherit">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function SearchResult({ article, terms }: { article: Article; terms: string[] }) {
  return (
    <article className="group relative grid grid-cols-[104px_1fr] gap-4 border-b border-line py-6 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-7">
      <ArticleImage article={article} variant="horizontal" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
          {getCategory(article.category)?.shortName ?? article.category}
          <span className="text-muted">
            {" "}
            · {contentTypeLabels[article.contentType]} · {article.readingTimeMinutes} min
          </span>
        </p>
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug tracking-[-0.01em] sm:text-2xl">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className="transition-colors duration-200 group-hover:text-brand-dark">
              {highlight(article.title, terms)}
            </span>
          </Link>
        </h3>
        <p className="mt-2 hidden text-sm leading-relaxed text-muted sm:line-clamp-2">
          {highlight(article.description, terms)}
        </p>
        <p className="mt-2 text-xs text-muted sm:mt-3">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </p>
      </div>
    </article>
  );
}

const selectClass =
  "h-11 border-0 border-b-2 border-line bg-transparent pr-6 text-sm font-semibold text-ink focus:border-brand focus:outline-none";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const tipo = contentTypes.find((type) => type === params.tipo);
  const categoria = getCategory(params.categoria ?? "")?.slug;
  const results = query
    ? searchArticles(query, { contentType: tipo, category: categoria })
    : [];
  const terms = normalize(query).split(/\s+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Busca</p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
          O que você procura?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          A busca cobre título, descrição, tags e o texto completo dos artigos — e ignora
          acentos.
        </p>
      </header>

      <form action="/buscar" role="search" className="mt-8 max-w-2xl">
        <div className="flex w-full items-end gap-3">
          <label htmlFor="q" className="sr-only">
            Buscar artigos
          </label>
          <input
            id="q"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Busque por título, tema ou editoria…"
            autoFocus
            className="h-11 w-full border-0 border-b-2 border-ink bg-transparent px-0 font-serif text-lg text-ink placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 shrink-0 bg-ink px-5 text-xs font-bold uppercase tracking-[0.14em] text-background transition-colors duration-200 hover:bg-brand"
          >
            Buscar
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div className="flex flex-col">
            <label
              htmlFor="tipo"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
            >
              Tipo
            </label>
            <select id="tipo" name="tipo" defaultValue={tipo ?? ""} className={selectClass}>
              <option value="">Todos</option>
              {contentTypes.map((type) => (
                <option key={type} value={type}>
                  {contentTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="categoria"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
            >
              Editoria
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue={categoria ?? ""}
              className={selectClass}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <section aria-live="polite" className="mt-12">
        {query === "" ? (
          <p className="text-sm text-muted">
            Digite um termo acima para começar — por exemplo, “inteligência artificial” ou
            “aplicativos”.
          </p>
        ) : results.length === 0 ? (
          <>
            <EmptyState
              title={`Nada encontrado para “${query}”`}
              message="Tente um termo mais curto ou mais geral, confira a grafia, remova os filtros ou navegue pelas editorias."
            />
            <nav aria-label="Sugestões de editorias" className="mt-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
                Ou explore uma editoria
              </p>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/categoria/${category.slug}`}
                      className="transition-colors duration-200 hover:text-brand-dark"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        ) : (
          <>
            <h2 className="border-b-2 border-ink pb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
              {results.length === 1
                ? `1 resultado para “${query}”`
                : `${results.length} resultados para “${query}”`}
            </h2>
            <div>
              {results.map((article) => (
                <SearchResult key={article.slug} article={article} terms={terms} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
