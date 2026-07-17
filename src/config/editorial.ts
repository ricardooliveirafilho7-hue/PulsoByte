/**
 * Vocabulário editorial: formatos de artigo, prioridade, status de revisão
 * e nível de dificuldade. Documentado em docs/article-formats.md.
 */

export const contentTypes = [
  "news",
  "explainer",
  "guide",
  "comparison",
  "analysis",
  "review",
  "visual-story",
  "opinion",
] as const;

export type ContentType = (typeof contentTypes)[number];

export const contentTypeLabels: Record<ContentType, string> = {
  news: "Notícia",
  explainer: "Explicador",
  guide: "Guia",
  comparison: "Comparativo",
  analysis: "Análise",
  review: "Review",
  "visual-story": "Reportagem visual",
  opinion: "Opinião",
};

/** Formato assumido quando o frontmatter não declara contentType. */
export const defaultContentTypeByCategory: Record<string, ContentType> = {
  noticias: "news",
  guias: "guide",
  comparativos: "comparison",
  "negocios-digitais": "analysis",
};

export const FALLBACK_CONTENT_TYPE: ContentType = "explainer";

export const editorialPriorities = ["lead", "featured", "standard"] as const;
export type EditorialPriority = (typeof editorialPriorities)[number];

export const reviewStatuses = [
  "draft",
  "fact-check",
  "reviewed",
  "published",
  "needs-update",
] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

/** Indicadores exibidos na abertura do artigo. Sem selos exagerados:
    só aparecem quando dizem algo útil ao leitor. */
export const reviewStatusLabels: Partial<Record<ReviewStatus, string>> = {
  "fact-check": "Em checagem",
  reviewed: "Conteúdo revisado",
  "needs-update": "Aguardando atualização",
};

export const difficulties = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof difficulties)[number];

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};
