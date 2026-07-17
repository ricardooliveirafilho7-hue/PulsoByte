import { trails, type TrailConfig } from "@/config/trails";
import { getArticles, type Article } from "@/lib/articles";

export interface Trail extends TrailConfig {
  articles: Article[];
  totalMinutes: number;
}

/** Trilhas com os artigos resolvidos, ignorando slugs não publicados. */
export function getTrails(): Trail[] {
  const bySlug = new Map(getArticles().map((article) => [article.slug, article]));
  return trails
    .map((trail) => {
      const articles = trail.articleSlugs
        .map((slug) => bySlug.get(slug))
        .filter((article): article is Article => article !== undefined);
      return {
        ...trail,
        articles,
        totalMinutes: articles.reduce((sum, article) => sum + article.readingTimeMinutes, 0),
      };
    })
    .filter((trail) => trail.articles.length >= 2);
}

/** Trilha a que um artigo pertence (se houver) e o próximo passo nela. */
export function getTrailForArticle(slug: string): { trail: Trail; next?: Article } | undefined {
  for (const trail of getTrails()) {
    const index = trail.articles.findIndex((article) => article.slug === slug);
    if (index >= 0) {
      return { trail, next: trail.articles[index + 1] };
    }
  }
  return undefined;
}
