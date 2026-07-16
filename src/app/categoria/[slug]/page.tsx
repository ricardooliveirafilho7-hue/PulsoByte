import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/config/categories";
import { site } from "@/config/site";
import { getArticlesByCategory, paginate } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: { canonical: `/categoria/${category.slug}` },
    openGraph: {
      title: category.seoTitle,
      description: category.seoDescription,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = getCategory(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(category.slug);
  const { items, currentPage, totalPages } = paginate(
    articles,
    Number(query.page) || 1,
    site.articlesPerPage
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Início", href: "/" },
          { label: "Categorias" },
          { label: category.name },
        ]}
      />

      <header className="mt-6 max-w-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
          <CategoryIcon icon={category.icon} className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{category.description}</p>
      </header>

      <div className="mt-10">
        {items.length === 0 ? (
          <EmptyState
            title="Ainda não há artigos nesta categoria"
            message={`Os próximos artigos de ${category.name} aparecerão aqui assim que forem publicados.`}
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
        basePath={`/categoria/${category.slug}`}
      />
    </div>
  );
}
