import Link from "next/link";
import type { Article } from "@/lib/articles";
import { getCategory } from "@/config/categories";
import { getCategoryAccent } from "@/config/design-tokens";
import { formatDate, formatDateShort } from "@/lib/format";
import { ArticleImage } from "@/components/ArticleImage";

/* ---------------------------------------------------------------------------
   Vocabulário editorial da capa e das listagens.
   Cada componente é uma composição diferente do mesmo conteúdo — sem caixas
   repetidas: a hierarquia vem de tipografia, divisórias e tamanho de imagem.
--------------------------------------------------------------------------- */

const EASE = "transition-colors duration-200";
const TITLE_HOVER = "group-hover:text-brand-dark";

/** Etiqueta editorial: “IA · 6 MIN”, “NOTÍCIAS”, com variação clara/escura. */
export function Kicker({
  article,
  showTime = true,
  tone = "light",
}: {
  article: Article;
  showTime?: boolean;
  tone?: "light" | "dark";
}) {
  const category = getCategory(article.category);
  const accent = getCategoryAccent(article.category);
  return (
    <p
      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
        tone === "dark" ? "text-panel-accent" : accent.text
      }`}
    >
      <Link
        href={`/categoria/${article.category}`}
        className={`relative z-10 ${EASE} hover:underline hover:underline-offset-4`}
      >
        {category?.shortName ?? article.category}
      </Link>
      {showTime && (
        <span className={tone === "dark" ? "text-white/50" : "text-muted"}>
          · {article.readingTimeMinutes} min
        </span>
      )}
    </p>
  );
}

function Meta({ article, tone = "light" }: { article: Article; tone?: "light" | "dark" }) {
  return (
    <p
      className={`text-xs ${tone === "dark" ? "text-white/50" : "text-muted"}`}
    >
      <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
    </p>
  );
}

/** Manchete principal da capa: imagem editorial grande e título serifado. */
export function LeadStory({ article }: { article: Article }) {
  return (
    <article className="group relative">
      <ArticleImage article={article} variant="hero" priority />
      <div className="mt-5 max-w-[640px]">
        <Kicker article={article} />
        <h2 className="mt-3 font-serif text-[2rem] font-bold leading-[1.06] tracking-[-0.015em] sm:text-[2.75rem] lg:text-[3.4rem]">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className={`${EASE} ${TITLE_HOVER}`}>{article.title}</span>
          </Link>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {article.description}
        </p>
        <div className="mt-4">
          <Meta article={article} />
        </div>
      </div>
    </article>
  );
}

/** Linha compacta para o fluxo “Últimas”: data curta e título, sem caixa. */
export function StoryListItem({ article }: { article: Article }) {
  return (
    <li className="group relative grid grid-cols-[72px_1fr] gap-3 border-b border-line py-4 last:border-b-0">
      <ArticleImage article={article} variant="thumbnail" sizes="72px" />
      <div className="min-w-0">
        <time
          dateTime={article.publishedAt}
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
        >
          {formatDateShort(article.publishedAt)}
        </time>
        <h3 className="mt-1 text-[15px] font-semibold leading-snug">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className={`${EASE} ${TITLE_HOVER}`}>{article.title}</span>
          </Link>
        </h3>
      </div>
    </li>
  );
}

/** Matéria em linha: miniatura à esquerda, texto à direita, divisória fina. */
export function HorizontalStory({ article }: { article: Article }) {
  return (
    <article className="group relative grid grid-cols-[104px_1fr] gap-4 border-b border-line py-6 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-7">
      <ArticleImage article={article} variant="horizontal" />
      <div className="min-w-0">
        <Kicker article={article} />
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug tracking-[-0.01em] sm:text-2xl">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className={`${EASE} ${TITLE_HOVER}`}>{article.title}</span>
          </Link>
        </h3>
        <p className="mt-2 hidden text-sm leading-relaxed text-muted sm:line-clamp-2">
          {article.description}
        </p>
        <div className="mt-2 sm:mt-3">
          <Meta article={article} />
        </div>
      </div>
    </article>
  );
}

/** Matéria só de texto: para listas de manchetes e módulos analíticos. */
export function TextStory({
  article,
  tone = "light",
  featuredImage = false,
}: {
  article: Article;
  tone?: "light" | "dark";
  featuredImage?: boolean;
}) {
  return (
    <article className="group relative">
      {featuredImage && <ArticleImage article={article} variant="featured" className="mb-5" />}
      <div className={featuredImage ? "" : "grid grid-cols-[96px_1fr] gap-4"}>
        {!featuredImage && <ArticleImage article={article} variant="related" sizes="96px" />}
        <div className="min-w-0">
          <Kicker article={article} tone={tone} />
          <h3
            className={`mt-2 font-serif text-xl font-bold leading-snug tracking-[-0.01em] sm:text-2xl ${
              tone === "dark" ? "text-white" : ""
            }`}
          >
            <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
              <span className={`${EASE} ${tone === "dark" ? "group-hover:text-panel-accent-bright" : TITLE_HOVER}`}>
                {article.title}
              </span>
            </Link>
          </h3>
          <p
            className={`mt-2.5 line-clamp-3 text-sm leading-relaxed ${
              tone === "dark" ? "text-white/60" : "text-muted"
            }`}
          >
            {article.description}
          </p>
          <div className="mt-3">
            <Meta article={article} tone={tone} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Matéria guiada pela imagem, com proporção variável. */
export function ImageStory({
  article,
  ratio = "4/3",
  priority = false,
}: {
  article: Article;
  ratio?: "16/9" | "4/3" | "1/1";
  priority?: boolean;
}) {
  return (
    <article className="group relative">
      <ArticleImage
        article={article}
        variant={ratio === "1/1" ? "thumbnail" : ratio === "4/3" ? "comparison" : "featured"}
        priority={priority}
      />
      <div className="mt-4">
        <Kicker article={article} />
        <h3 className="mt-2 font-serif text-xl font-bold leading-snug tracking-[-0.01em] sm:text-[1.65rem]">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className={`${EASE} ${TITLE_HOVER}`}>{article.title}</span>
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {article.description}
        </p>
      </div>
    </article>
  );
}

/** Metade de uma composição dividida de comparativo. */
export function ComparisonStory({ article, index }: { article: Article; index: number }) {
  return (
    <article className="group relative">
      <p className="font-serif text-5xl font-bold leading-none text-line transition-colors duration-200 group-hover:text-brand sm:text-6xl">
        {String(index + 1).padStart(2, "0")}
      </p>
      <ArticleImage article={article} variant="comparison" className="mt-4" />
      <div className="mt-4">
        <Kicker article={article} />
        <h3 className="mt-2 font-serif text-xl font-bold leading-snug tracking-[-0.01em] sm:text-2xl">
          <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
            <span className={`${EASE} ${TITLE_HOVER}`}>{article.title}</span>
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {article.description}
        </p>
      </div>
    </article>
  );
}
