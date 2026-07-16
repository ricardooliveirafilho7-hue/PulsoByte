import type { Metadata } from "next";
import { searchArticles } from "@/lib/articles";
import { HorizontalStory } from "@/components/stories";
import { EmptyState } from "@/components/EmptyState";
import { SearchForm } from "@/components/SearchForm";

export const metadata: Metadata = {
  title: "Buscar artigos",
  description:
    "Busque artigos do PulsoByte por título, tema, categoria ou tag — tecnologia sem ruído.",
  alternates: { canonical: "/buscar" },
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? searchArticles(query) : [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Busca</p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
          O que você procura?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Encontre artigos por título, tema, editoria ou tag. A busca ignora acentos.
        </p>
      </header>

      <div className="mt-8 max-w-xl">
        <SearchForm defaultValue={query} autoFocus />
      </div>

      <section aria-live="polite" className="mt-12">
        {query === "" ? (
          <p className="text-sm text-muted">
            Digite um termo acima para começar — por exemplo, “inteligência artificial” ou
            “aplicativos”.
          </p>
        ) : results.length === 0 ? (
          <EmptyState
            title={`Nada encontrado para “${query}”`}
            message="Tente um termo mais curto ou mais geral, confira a grafia ou navegue pelas editorias."
          />
        ) : (
          <>
            <h2 className="border-b-2 border-ink pb-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
              {results.length === 1
                ? `1 resultado para “${query}”`
                : `${results.length} resultados para “${query}”`}
            </h2>
            <div>
              {results.map((article) => (
                <HorizontalStory key={article.slug} article={article} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
