import type { Metadata } from "next";
import { searchArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Buscar</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Encontre artigos por título, tema, categoria ou tag. A busca ignora acentos.
        </p>
      </header>

      <div className="mt-8">
        <SearchForm defaultValue={query} autoFocus />
      </div>

      <section aria-live="polite" className="mt-10">
        {query === "" ? (
          <p className="text-sm text-muted">
            Digite um termo acima para começar — por exemplo, “inteligência artificial” ou
            “aplicativos”.
          </p>
        ) : results.length === 0 ? (
          <EmptyState
            title={`Nada encontrado para “${query}”`}
            message="Tente um termo mais curto ou mais geral, confira a grafia ou navegue pelas categorias."
          />
        ) : (
          <>
            <h2 className="mb-6 text-sm font-semibold text-muted">
              {results.length === 1
                ? `1 resultado para “${query}”`
                : `${results.length} resultados para “${query}”`}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
