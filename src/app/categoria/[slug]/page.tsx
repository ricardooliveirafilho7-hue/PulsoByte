import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/config/categories";
import { site } from "@/config/site";
import { getArticlesByCategory, paginate } from "@/lib/articles";
import { HorizontalStory, LeadStory } from "@/components/stories";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
  const page = Number(query.page) || 1;
  const { items, currentPage, totalPages } = paginate(articles, page, site.articlesPerPage);

  // Na primeira página, a matéria mais recente abre a editoria em destaque.
  const [first, ...others] = items;
  const showLead = currentPage === 1 && first !== undefined;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[{ label: "Início", href: "/" }, { label: "Editorias" }, { label: category.name }]}
      />

      <header className="mt-8 max-w-3xl border-b-2 border-ink pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Editoria</p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
          {category.name}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">{category.description}</p>
      </header>

      <div className="mt-10">
        {items.length === 0 ? (
          <EmptyState
            title="Ainda não há artigos nesta editoria"
            message={`Os próximos artigos de ${category.name} aparecerão aqui assim que forem publicados.`}
          />
        ) : showLead ? (
          <>
            <LeadStory article={first} />
            {others.length > 0 && (
              <div className="mt-14 border-t-2 border-ink">
                {others.map((article) => (
                  <HorizontalStory key={article.slug} article={article} />
                ))}
              </div>
            )}
          </>
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
        basePath={`/categoria/${category.slug}`}
      />
    </div>
  );
}
