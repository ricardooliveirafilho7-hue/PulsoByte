import type { MetadataRoute } from "next";
import { categories } from "@/config/categories";
import { absoluteUrl } from "@/config/site";
import { getArticles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/artigos",
    "/sobre",
    "/contato",
    "/politica-editorial",
    "/politica-de-privacidade",
    "/politica-de-cookies",
    "/termos-de-uso",
  ].map((route) => ({
    url: absoluteUrl(route),
    changeFrequency: route === "/" ? ("daily" as const) : ("monthly" as const),
    priority: route === "/" ? 1 : 0.5,
  }));

  const categoryRoutes = categories.map((category) => ({
    url: absoluteUrl(`/categoria/${category.slug}`),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Apenas artigos publicados: em produção, getArticles() já exclui rascunhos.
  const articleRoutes = getArticles()
    .filter((article) => article.status === "published")
    .map((article) => ({
      url: absoluteUrl(`/artigos/${article.slug}`),
      lastModified: new Date(`${article.updatedAt}T12:00:00Z`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
