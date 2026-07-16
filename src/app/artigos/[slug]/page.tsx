import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCategory } from "@/config/categories";
import { site, absoluteUrl } from "@/config/site";
import { getArticle, getArticles, getRelatedArticles } from "@/lib/articles";
import { getTableOfContents } from "@/lib/toc";
import { formatDate } from "@/lib/format";
import { ArticleCard, CategoryBadge } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { TableOfContents } from "@/components/TableOfContents";
import { MdxContent } from "@/components/mdx/MdxContent";

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `/artigos/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.seoTitle,
      description: article.seoDescription,
      url: absoluteUrl(`/artigos/${article.slug}`),
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      images: [{ url: article.coverImage, alt: article.coverImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.seoDescription,
      images: [article.coverImage],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const category = getCategory(article.category);
  const related = getRelatedArticles(article);
  const toc = getTableOfContents(article.content);
  const wasUpdated = article.updatedAt !== article.publishedAt;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: absoluteUrl(article.coverImage),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: site.locale,
    mainEntityOfPage: absoluteUrl(`/artigos/${article.slug}`),
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={jsonLd} />

      <article className="mx-auto max-w-[720px]">
        <Breadcrumbs
          items={[
            { label: "Início", href: "/" },
            { label: "Artigos", href: "/artigos" },
            ...(category ? [{ label: category.name, href: `/categoria/${category.slug}` }] : []),
            { label: article.title },
          ]}
        />

        <header className="mt-6">
          <CategoryBadge slug={article.category} />
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{article.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-line py-4 text-sm text-muted">
            <span className="font-semibold text-ink">{article.author}</span>
            <span aria-hidden="true">·</span>
            <span>
              Publicado em <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            </span>
            {wasUpdated && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Atualizado em <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{article.readingTimeMinutes} min de leitura</span>
          </div>
        </header>

        <figure className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-line">
          <Image
            src={article.coverImage}
            alt={article.coverImageAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
        </figure>

        <div className="mt-8">
          <TableOfContents entries={toc} />
        </div>

        <div className="article-body mt-8">
          <MdxContent source={article.content} />
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="mx-auto mt-16 max-w-6xl">
          <h2 id="relacionados" className="mb-6 border-b border-line pb-3 text-xl font-bold tracking-tight sm:text-2xl">
            Leia também
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((relatedArticle) => (
              <ArticleCard key={relatedArticle.slug} article={relatedArticle} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
