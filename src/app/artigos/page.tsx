import type { Metadata } from "next";
import Link from "next/link";
import { categories, getCategory } from "@/config/categories";
import { site } from "@/config/site";
import { getArticles, paginate } from "@/lib/articles";
import { HorizontalStory } from "@/components/stories";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { SearchForm } from "@/components/SearchForm";

export const metadata: Metadata = {
  title: "Todos os artigos",
  description:
    "Todas as publicações do PulsoByte: inteligência artificial, aplicativos, tecnologia, negócios digitais, guias, comparativos e notícias.",
  alternates: { canonical: "/artigos" },
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = getCategory(params.categoria ?? "");
  const page = Number(params.page) || 1;

  const all = getArticles();
  const filtered = activeCategory
    ? all.filter((article) => article.category === activeCategory.slug)
    : all;
  const { items, currentPage, totalPages } = paginate(filtered, page, site.articlesPerPage);

  const filterClass = (active: boolean) =>
    `inline-block border-b-2 pb-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
      active
        ? "border-brand text-ink"
        : "border-transparent text-muted hover:border-line hover:text-ink"
    }`;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Arquivo</p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
          Todos os artigos
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          As publicações mais recentes do PulsoByte, em ordem cronológica. Use a busca ou filtre
          por editoria.
        </p>
      </header>

      <div className="mt-8 max-w-xl">
        <SearchForm />
      </div>

      <nav
        aria-label="Filtrar por editoria"
        className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-b border-line pb-0"
      >
        <Link href="/artigos" className={filterClass(!activeCategory)}>
          Todas
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/artigos?categoria=${category.slug}`}
            className={filterClass(activeCategory?.slug === category.slug)}
          >
            {category.shortName}
          </Link>
        ))}
      </nav>

      <div className="mt-2">
        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Nenhum artigo por aqui ainda"
              message={
                activeCategory
                  ? `Ainda não há artigos publicados em ${activeCategory.name}.`
                  : "Ainda não há artigos publicados."
              }
            />
          </div>
        ) : (
          <div>
            {items.map((article) => (
              <HorizontalStory key={article.slug} article={article} />
            ))}
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/artigos"
        searchParams={activeCategory ? { categoria: activeCategory.slug } : {}}
      />
    </div>
  );
}
