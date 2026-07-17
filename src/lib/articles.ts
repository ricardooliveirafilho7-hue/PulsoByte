import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { categorySlugs } from "@/config/categories";
import {
  contentTypes,
  defaultContentTypeByCategory,
  difficulties,
  editorialPriorities,
  FALLBACK_CONTENT_TYPE,
  reviewStatuses,
  type ContentType,
  type Difficulty,
  type EditorialPriority,
  type ReviewStatus,
} from "@/config/editorial";

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
  contentType: ContentType;
  editorialPriority: EditorialPriority;
  reviewStatus: ReviewStatus;
  difficulty?: Difficulty;
  evergreen: boolean;
  publicationSlot?: "morning" | "evening";
  automationRunId?: string;
  topicKey?: string;
  primaryEntity?: string;
  searchIntent?: "informational" | "practical" | "comparison" | "news" | "safety";
  coverImage: string;
  coverImageAlt: string;
  coverImageCaption?: string;
  coverImageCredit: string;
  coverImageCreditUrl?: string;
  coverImageSource: string;
  coverImageLicense?: string;
  coverImageType: CoverImageType;
  coverImagePosition: string;
  seoTitle: string;
  seoDescription: string;
  readingTimeMinutes: number;
  content: string;
}

export const coverImageTypes = [
  "photo",
  "official",
  "press",
  "screenshot",
  "diagram",
  "illustration",
  "original",
] as const;

export type CoverImageType = (typeof coverImageTypes)[number];

function isCoverImageType(value: unknown): value is CoverImageType {
  return typeof value === "string" && coverImageTypes.some((type) => type === value);
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

const REQUIRED_PUBLISHED_IMAGE_FIELDS = [
  "coverImageCredit",
  "coverImageSource",
  "coverImageType",
  "coverImagePosition",
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
  if (data.status === "published") {
    for (const field of REQUIRED_PUBLISHED_IMAGE_FIELDS) {
      if (typeof data[field] !== "string" || data[field].trim() === "") {
        throw new Error(
          `Erro no artigo "${data.slug}": ${field} não foi preenchido. Corrija o frontmatter antes de publicar.`
        );
      }
    }
  }
  if (typeof data.coverImageType === "string" && !isCoverImageType(data.coverImageType)) {
    throw new Error(
      `Erro no artigo "${data.slug}": coverImageType "${data.coverImageType}" é inválido. Use: ${coverImageTypes.join(", ")}.`
    );
  }
  if (
    typeof data.coverImagePosition === "string" &&
    !/^(?:100|\d{1,2})% (?:100|\d{1,2})%$/.test(data.coverImagePosition)
  ) {
    throw new Error(
      `Erro no artigo "${data.slug}": coverImagePosition deve usar dois percentuais, por exemplo "50% 50%".`
    );
  }
  if (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string")) {
    throw new Error(`Artigo "${fileName}": "tags" deve ser uma lista de textos.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    throw new Error(
      `Artigo "${fileName}": slug "${data.slug}" inválido. Use apenas letras minúsculas, números e hífens.`
    );
  }

  // Campos editoriais opcionais: validados quando presentes, com padrões
  // seguros para não quebrar artigos existentes.
  const oneOf = <T extends string>(field: string, list: readonly T[]): T | undefined => {
    const value = data[field];
    if (value === undefined) return undefined;
    if (typeof value !== "string" || !list.some((item) => item === value)) {
      throw new Error(
        `Artigo "${fileName}": "${field}" inválido ("${String(value)}"). Use um de: ${list.join(", ")}.`
      );
    }
    return value as T;
  };

  const contentType =
    oneOf("contentType", contentTypes) ??
    defaultContentTypeByCategory[data.category] ??
    FALLBACK_CONTENT_TYPE;
  const editorialPriority =
    oneOf("editorialPriority", editorialPriorities) ??
    (data.featured === true ? "featured" : "standard");
  const reviewStatus =
    oneOf("reviewStatus", reviewStatuses) ?? (data.status === "draft" ? "draft" : "reviewed");
  const difficulty = oneOf("difficulty", difficulties);
  const evergreen =
    typeof data.evergreen === "boolean"
      ? data.evergreen
      : ["explainer", "guide", "comparison"].includes(contentType);

  const publicationSlot = oneOf("publicationSlot", ["morning", "evening"] as const);
  const searchIntent = oneOf(
    "searchIntent",
    ["informational", "practical", "comparison", "news", "safety"] as const
  );

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
    contentType,
    editorialPriority,
    reviewStatus,
    difficulty,
    evergreen,
    publicationSlot,
    automationRunId:
      typeof data.automationRunId === "string" ? data.automationRunId : undefined,
    topicKey: typeof data.topicKey === "string" ? data.topicKey : undefined,
    primaryEntity: typeof data.primaryEntity === "string" ? data.primaryEntity : undefined,
    searchIntent,
    coverImage: data.coverImage,
    coverImageAlt: data.coverImageAlt,
    coverImageCaption:
      typeof data.coverImageCaption === "string" ? data.coverImageCaption : undefined,
    coverImageCredit:
      typeof data.coverImageCredit === "string" ? data.coverImageCredit : "PulsoByte",
    coverImageCreditUrl:
      typeof data.coverImageCreditUrl === "string" ? data.coverImageCreditUrl : undefined,
    coverImageSource:
      typeof data.coverImageSource === "string" ? data.coverImageSource : "Produção própria",
    coverImageLicense:
      typeof data.coverImageLicense === "string" ? data.coverImageLicense : undefined,
    coverImageType: isCoverImageType(data.coverImageType)
      ? data.coverImageType
      : "original",
    coverImagePosition:
      typeof data.coverImagePosition === "string" ? data.coverImagePosition : "50% 50%",
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

/**
 * Pares de formatos complementares: além do conteúdo parecido, recomenda o
 * próximo passo natural de leitura (ex.: depois do explicador, um guia).
 */
const COMPLEMENTARY: Partial<Record<Article["contentType"], Article["contentType"][]>> = {
  explainer: ["guide", "comparison", "analysis"],
  guide: ["explainer", "comparison"],
  comparison: ["review", "guide", "explainer"],
  news: ["explainer", "analysis"],
  analysis: ["explainer", "news"],
  review: ["comparison", "guide"],
};

/**
 * Relacionados por score editorial: categoria e tags em comum, formato
 * complementar, conteúdo duradouro e recência como critérios combinados.
 */
export function getRelatedArticles(current: Article, limit = 3): Article[] {
  const now = Date.now();
  return getArticles()
    .filter((article) => article.slug !== current.slug)
    .map((article) => {
      const sharedTags = article.tags.filter((tag) => current.tags.includes(tag)).length;
      let score = 0;
      if (article.category === current.category) score += 40;
      score += Math.min(sharedTags, 3) * 15;
      if (COMPLEMENTARY[current.contentType]?.includes(article.contentType)) score += 18;
      else if (article.contentType === current.contentType) score += 8;
      if (article.evergreen) score += 6;
      const ageDays = (now - new Date(article.publishedAt).getTime()) / 86_400_000;
      if (ageDays <= 30) score += 10;
      else if (ageDays <= 90) score += 5;
      if (current.difficulty && article.difficulty === current.difficulty) score += 4;
      return { article, score };
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

export interface SearchFilters {
  contentType?: string;
  category?: string;
}

/**
 * Busca estática ignorando acentos, com peso editorial: título e descrição
 * valem mais que o corpo do texto. Filtros opcionais de formato e editoria.
 */
export function searchArticles(query: string, filters: SearchFilters = {}): Article[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return getArticles()
    .filter(
      (article) =>
        (!filters.contentType || article.contentType === filters.contentType) &&
        (!filters.category || article.category === filters.category)
    )
    .map((article) => {
      const heavy = normalize(
        [article.title, article.description, article.category, ...article.tags].join(" ")
      );
      const body = normalize(article.content);
      let score = 0;
      for (const term of terms) {
        if (heavy.includes(term)) score += 10;
        else if (body.includes(term)) score += 2;
        else return { article, score: 0 };
      }
      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime()
    )
    .map((entry) => entry.article);
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
