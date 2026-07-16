import type { Metadata } from "next";
import Link from "next/link";
import { categories, getCategory } from "@/config/categories";
import { site } from "@/config/site";
import { getArticles, paginate } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
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
    `inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium ${
      active
        ? "border-brand bg-brand text-white"
        : "border-line bg-surface text-muted hover:border-brand hover:text-brand-dark"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Todos os artigos</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          As publicações mais recentes do PulsoByte, em ordem cronológica. Use a busca ou filtre
          por categoria.
        </p>
      </header>

      <div className="mt-8">
        <SearchForm />
      </div>

      <nav aria-label="Filtrar por categoria" className="mt-6 flex flex-wrap gap-2">
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

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum artigo por aqui ainda"
            message={
              activeCategory
                ? `Ainda não há artigos publicados em ${activeCategory.name}.`
                : "Ainda não há artigos publicados."
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <ArticleCard key={article.slug} article={article} />
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
