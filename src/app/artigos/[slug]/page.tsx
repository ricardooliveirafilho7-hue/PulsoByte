import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/config/categories";
import { site, absoluteUrl } from "@/config/site";
import {
  contentTypeLabels,
  difficultyLabels,
  reviewStatusLabels,
} from "@/config/editorial";
import { getArticle, getArticles, getRelatedArticles } from "@/lib/articles";
import { SaveArticleButton } from "@/components/interactive/SaveArticleButton";
import { getTableOfContents } from "@/lib/toc";
import { formatDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareRail } from "@/components/ShareRail";
import { MobileToc, TocList } from "@/components/TableOfContents";
import { TextStory } from "@/components/stories";
import { AdSlot } from "@/components/mdx";
import { MdxContent } from "@/components/mdx/MdxContent";
import { ArticleImage } from "@/components/ArticleImage";

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
  const articleUrl = absoluteUrl(`/artigos/${article.slug}`);

  // Indicadores úteis na abertura — só aparecem quando dizem algo ao leitor.
  const reviewLabel = reviewStatusLabels[article.reviewStatus];
  const difficultyLabel = article.difficulty ? difficultyLabels[article.difficulty] : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": article.contentType === "news" ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.description,
    image: absoluteUrl(article.coverImage),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: site.locale,
    mainEntityOfPage: articleUrl,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <ReadingProgress />
      <JsonLd data={jsonLd} />

      {/* Abertura centrada, com imagem mais larga que a coluna de texto */}
      <header className="mx-auto max-w-[880px] text-center">
        <Breadcrumbs
          items={[
            { label: "Início", href: "/" },
            { label: "Artigos", href: "/artigos" },
            ...(category ? [{ label: category.name, href: `/categoria/${category.slug}` }] : []),
            { label: article.title },
          ]}
          align="center"
        />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-brand">
          {category?.name}
          <span className="text-muted"> · {contentTypeLabels[article.contentType]}</span>
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl lg:text-[3.75rem]">
          {article.title}
        </h1>
        <p className="mx-auto mt-6 max-w-[640px] text-lg leading-relaxed text-muted">
          {article.description}
        </p>
        <div className="mx-auto mt-8 flex max-w-[640px] flex-wrap items-center justify-center gap-x-4 gap-y-1 border-y border-line py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Link
            href="/sobre#redacao"
            className="relative z-10 text-ink transition-colors hover:text-brand-dark"
          >
            {article.author}
          </Link>
          <span aria-hidden="true" className="text-line">|</span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          {wasUpdated && (
            <>
              <span aria-hidden="true" className="text-line">|</span>
              <span>
                Atualizado{" "}
                <time dateTime={article.updatedAt}>{formatDate(article.updatedAt)}</time>
              </span>
            </>
          )}
          <span aria-hidden="true" className="text-line">|</span>
          <span>{article.readingTimeMinutes} min de leitura</span>
          {reviewLabel && (
            <>
              <span aria-hidden="true" className="text-line">|</span>
              <span>{reviewLabel}</span>
            </>
          )}
          {difficultyLabel && (
            <>
              <span aria-hidden="true" className="text-line">|</span>
              <span>Nível: {difficultyLabel}</span>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <SaveArticleButton
            article={{
              slug: article.slug,
              title: article.title,
              publishedAt: article.publishedAt,
              coverImage: article.coverImage,
              category: article.category,
            }}
          />
        </div>
      </header>

      <div className="mx-auto mt-10 max-w-[1080px]">
        <ArticleImage article={article} variant="article" priority />
      </div>

      {/* Corpo em três colunas no desktop: compartilhar / texto / índice */}
      <div className="mx-auto mt-10 max-w-[1160px] lg:grid lg:grid-cols-[56px_minmax(0,1fr)_280px] lg:gap-12">
        <div className="hidden lg:block">
          <div className="sticky top-10">
            <ShareRail url={articleUrl} title={article.title} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[var(--article-max)]">
          <div className="mb-8 lg:hidden">
            <MobileToc entries={toc} />
          </div>
          <div className="mb-8 lg:hidden">
            <ShareRail url={articleUrl} title={article.title} />
          </div>
          <div className="article-body">
            <MdxContent source={article.content} />
          </div>
        </div>

        <aside className="hidden lg:block" aria-label="Complementos do artigo">
          <div className="sticky top-10 space-y-10">
            {toc.length >= 2 && (
              <nav aria-label="Índice do artigo">
                <p className="border-t-2 border-ink pt-3 text-[11px] font-bold uppercase tracking-[0.18em]">
                  Neste artigo
                </p>
                <div className="mt-4">
                  <TocList entries={toc} />
                </div>
              </nav>
            )}
            {related.length > 0 && (
              <nav aria-label="Artigos relacionados" data-focus-hide>
                <p className="border-t-2 border-ink pt-3 text-[11px] font-bold uppercase tracking-[0.18em]">
                  Relacionados
                </p>
                <ul className="mt-4 space-y-4">
                  {related.map((item) => (
                    <li key={item.slug} className="group relative border-b border-line pb-4 last:border-b-0">
                      <ArticleImage article={item} variant="related" sizes="240px" />
                      <Link
                        href={`/artigos/${item.slug}`}
                        className="mt-2 block text-sm font-semibold leading-snug transition-colors duration-200 hover:text-brand-dark after:absolute after:inset-0"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <AdSlot slot="artigo-lateral" />
          </div>
        </aside>
      </div>

      {/* Relacionados no fim da página para telas menores */}
      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="mt-16 lg:hidden" data-focus-hide>
          <div className="border-t-2 border-ink pt-3">
            <h2 id="relacionados" className="text-sm font-bold uppercase tracking-[0.18em]">
              Leia também
            </h2>
          </div>
          <div className="mt-8 grid gap-10 sm:grid-cols-3">
            {related.map((item) => (
              <TextStory key={item.slug} article={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
