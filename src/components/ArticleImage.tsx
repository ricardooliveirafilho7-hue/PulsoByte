import Image from "next/image";
import type { Article } from "@/lib/articles";

export type ArticleImageVariant =
  | "hero"
  | "featured"
  | "horizontal"
  | "thumbnail"
  | "comparison"
  | "article"
  | "related";

const variantClasses: Record<ArticleImageVariant, string> = {
  hero: "aspect-[16/9]",
  featured: "aspect-[16/9]",
  horizontal: "aspect-square sm:aspect-[4/3]",
  thumbnail: "aspect-square",
  comparison: "aspect-[4/3]",
  article: "aspect-[16/9]",
  related: "aspect-[4/3]",
};

const defaultSizes: Record<ArticleImageVariant, string> = {
  hero: "(max-width: 1024px) 100vw, 800px",
  featured: "(max-width: 1024px) 100vw, 640px",
  horizontal: "(max-width: 640px) 104px, 200px",
  thumbnail: "96px",
  comparison: "(max-width: 640px) 100vw, 520px",
  article: "(max-width: 1080px) 100vw, 1080px",
  related: "(max-width: 640px) 112px, 240px",
};

export function ArticleImage({
  article,
  variant,
  priority = false,
  className = "",
  sizes,
  showMeta = variant === "article",
}: {
  article: Article;
  variant: ArticleImageVariant;
  priority?: boolean;
  className?: string;
  sizes?: string;
  showMeta?: boolean;
}) {
  const image = (
    <div
      className={`relative overflow-hidden bg-paper-deep ${variantClasses[variant]} ${className}`}
    >
      <Image
        src={article.coverImage}
        alt={article.coverImageAlt}
        fill
        priority={priority}
        sizes={sizes ?? defaultSizes[variant]}
        style={{ objectPosition: article.coverImagePosition }}
        className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
      />
      {article.status === "draft" && (
        <span className="absolute inset-x-0 bottom-0 bg-amber-400 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-black">
          Imagem provisória — substituir antes de publicar
        </span>
      )}
    </div>
  );

  if (!showMeta) return image;

  const credit = article.coverImageCreditUrl ? (
    <a
      href={article.coverImageCreditUrl}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-line underline-offset-2 transition-colors hover:text-brand-dark"
    >
      {article.coverImageCredit}
    </a>
  ) : (
    article.coverImageCredit
  );

  return (
    <figure>
      {image}
      <figcaption className="mt-2.5 text-xs leading-relaxed text-muted">
        {article.coverImageCaption && <span>{article.coverImageCaption} </span>}
        <span>Foto: {credit}/{article.coverImageSource}.</span>
      </figcaption>
    </figure>
  );
}
