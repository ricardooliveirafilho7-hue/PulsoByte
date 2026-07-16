import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/articles";
import { getCategory } from "@/config/categories";
import { formatDate } from "@/lib/format";

export function ArticleMeta({ article }: { article: Article }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{article.readingTimeMinutes} min de leitura</span>
    </p>
  );
}

export function CategoryBadge({ slug }: { slug: string }) {
  const category = getCategory(slug);
  if (!category) return null;
  return (
    <Link
      href={`/categoria/${category.slug}`}
      className="relative z-10 inline-block rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand hover:text-white"
    >
      {category.name}
    </Link>
  );
}

/** Card padrão das listagens. `compact` remove a imagem para listas densas. */
export function ArticleCard({
  article,
  compact = false,
}: {
  article: Article;
  compact?: boolean;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md">
      {!compact && (
        <div className="relative aspect-[16/9]">
          <Image
            src={article.coverImage}
            alt={article.coverImageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <CategoryBadge slug={article.category} />
        <h3 className="text-lg font-bold leading-snug">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className="group-hover:text-brand-dark">{article.title}</span>
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{article.description}</p>
        <div className="mt-auto pt-2">
          <ArticleMeta article={article} />
        </div>
      </div>
    </article>
  );
}
