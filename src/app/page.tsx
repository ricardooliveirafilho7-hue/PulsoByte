import Image from "next/image";
import Link from "next/link";
import { categories, getCategory } from "@/config/categories";
import { site, absoluteUrl } from "@/config/site";
import { getArticles, getArticlesByCategory, type Article } from "@/lib/articles";
import { ArticleCard, ArticleMeta, CategoryBadge } from "@/components/ArticleCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/EmptyState";
import { JsonLd } from "@/components/JsonLd";

export const metadata = {
  title: { absolute: `${site.name} — Tecnologia sem ruído` },
  alternates: { canonical: "/" },
};

const editorialSections = ["inteligencia-artificial", "guias", "comparativos", "negocios-digitais"];

function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-brand-dark hover:underline">
          Ver todos →
        </Link>
      )}
    </div>
  );
}

function HeroArticle({ article }: { article: Article }) {
  return (
    <article className="group relative grid overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-2">
      <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-96">
        <Image
          src={article.coverImage}
          alt={article.coverImageAlt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-10">
        <CategoryBadge slug={article.category} />
        <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className="group-hover:text-brand-dark">{article.title}</span>
          </Link>
        </h2>
        <p className="text-base leading-relaxed text-muted">{article.description}</p>
        <ArticleMeta article={article} />
      </div>
    </article>
  );
}

export default function HomePage() {
  const articles = getArticles();
  const featured = articles.find((article) => article.featured) ?? articles[0];
  const secondary = articles.filter((article) => article.slug !== featured?.slug).slice(0, 3);
  const latest = articles.slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organizacao"),
        name: site.name,
        url: site.url,
        slogan: site.slogan,
        logo: absoluteUrl("/icon.svg"),
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#site"),
        name: site.name,
        url: site.url,
        description: site.description,
        inLanguage: site.locale,
        publisher: { "@id": absoluteUrl("/#organizacao") },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/buscar")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  if (!featured) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <JsonLd data={jsonLd} />
        <EmptyState
          title="Ainda não há artigos publicados"
          message="Adicione arquivos MDX em content/articles para começar a publicar."
          actionHref="/"
          actionLabel="Voltar ao início"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={jsonLd} />

      {/* Destaques */}
      <section aria-labelledby="destaques">
        <h2 id="destaques" className="sr-only">
          Destaques
        </h2>
        <HeroArticle article={featured} />
        {secondary.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((article) => (
              <ArticleCard key={article.slug} article={article} compact />
            ))}
          </div>
        )}
      </section>

      {/* Últimas publicações */}
      <section aria-labelledby="ultimas" className="mt-16">
        <SectionHeading title="Últimas publicações" href="/artigos" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section aria-labelledby="categorias" className="mt-16">
        <SectionHeading title="Explore por categoria" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categoria/${category.slug}`}
              className="group rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand"
            >
              <span className="flex items-center gap-2.5 font-bold text-ink group-hover:text-brand-dark">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
                  <CategoryIcon icon={category.icon} />
                </span>
                {category.name}
              </span>
              <p className="mt-2.5 line-clamp-2 text-sm text-muted">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Seções editoriais */}
      {editorialSections.map((slug) => {
        const category = getCategory(slug);
        const sectionArticles = getArticlesByCategory(slug).slice(0, 3);
        if (!category || sectionArticles.length === 0) return null;
        return (
          <section key={slug} aria-labelledby={`secao-${slug}`} className="mt-16">
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <h2 id={`secao-${slug}`} className="text-xl font-bold tracking-tight sm:text-2xl">
                {category.name}
              </h2>
              <Link
                href={`/categoria/${slug}`}
                className="shrink-0 text-sm font-semibold text-brand-dark hover:underline"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sectionArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
