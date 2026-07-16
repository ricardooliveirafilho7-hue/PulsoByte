import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { categorySlugs } from "@/config/categories";

export interface Article {
  title: string;
  description: string;
  slug: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  status: "draft" | "published";
  featured: boolean;
  coverImage: string;
  coverImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  readingTimeMinutes: number;
  content: string;
}

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const WORDS_PER_MINUTE = 200;

const REQUIRED_STRINGS = [
  "title",
  "description",
  "slug",
  "category",
  "author",
  "publishedAt",
  "updatedAt",
  "coverImage",
  "coverImageAlt",
] as const;

function parseArticle(fileName: string): Article {
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  for (const field of REQUIRED_STRINGS) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      throw new Error(`Artigo "${fileName}": campo obrigatório "${field}" ausente ou vazio.`);
    }
  }
  if (!categorySlugs.includes(data.category)) {
    throw new Error(
      `Artigo "${fileName}": categoria "${data.category}" inválida. Use uma de: ${categorySlugs.join(", ")}.`
    );
  }
  if (data.status !== "draft" && data.status !== "published") {
    throw new Error(`Artigo "${fileName}": "status" deve ser "draft" ou "published".`);
  }
  if (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string")) {
    throw new Error(`Artigo "${fileName}": "tags" deve ser uma lista de textos.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    throw new Error(
      `Artigo "${fileName}": slug "${data.slug}" inválido. Use apenas letras minúsculas, números e hífens.`
    );
  }

  const words = content.split(/\s+/).filter(Boolean).length;

  return {
    title: data.title,
    description: data.description,
    slug: data.slug,
    category: data.category,
    tags: data.tags,
    author: data.author,
    publishedAt: data.publishedAt,
    updatedAt: data.updatedAt,
    status: data.status,
    featured: data.featured === true,
    coverImage: data.coverImage,
    coverImageAlt: data.coverImageAlt,
    seoTitle: typeof data.seoTitle === "string" ? data.seoTitle : data.title,
    seoDescription:
      typeof data.seoDescription === "string" ? data.seoDescription : data.description,
    readingTimeMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    content,
  };
}

function loadArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  const articles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map(parseArticle);

  const seen = new Set<string>();
  for (const article of articles) {
    if (seen.has(article.slug)) {
      throw new Error(`Slug duplicado: "${article.slug}". Cada artigo precisa de um slug único.`);
    }
    seen.add(article.slug);
  }

  return articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

let cache: Article[] | null = null;

/** Todos os artigos visíveis, mais recentes primeiro. Rascunhos aparecem apenas em desenvolvimento. */
export function getArticles(): Article[] {
  cache ??= loadArticles();
  if (process.env.NODE_ENV === "development") return cache;
  return cache.filter((article) => article.status === "published");
}

export function getArticle(slug: string): Article | undefined {
  return getArticles().find((article) => article.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return getArticles().filter((article) => article.category === categorySlug);
}

/** Relacionados: mesma categoria, depois tags em comum, com data recente como desempate. */
export function getRelatedArticles(current: Article, limit = 3): Article[] {
  return getArticles()
    .filter((article) => article.slug !== current.slug)
    .map((article) => {
      const sharedTags = article.tags.filter((tag) => current.tags.includes(tag)).length;
      const sameCategory = article.category === current.category ? 1 : 0;
      return { article, score: sameCategory * 100 + sharedTags };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime()
    )
    .slice(0, limit)
    .map((entry) => entry.article);
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Busca estática sobre título, descrição, categoria e tags, ignorando acentos. */
export function searchArticles(query: string): Article[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return getArticles().filter((article) => {
    const haystack = normalize(
      [article.title, article.description, article.category, ...article.tags].join(" ")
    );
    return terms.every((term) => haystack.includes(term));
  });
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((currentPage - 1) * perPage, currentPage * perPage),
    currentPage,
    totalPages,
  };
}
