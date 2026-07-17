"use client";

import { useEffect, useState } from "react";

/* ---------------------------------------------------------------------------
   Salvar artigo para ler depois. Os dados ficam em localStorage ("pb-saved")
   — apenas neste dispositivo, sem conta. A lista aparece em /salvos.
--------------------------------------------------------------------------- */

export interface SavedArticle {
  slug: string;
  title: string;
  publishedAt: string;
  coverImage: string;
  category: string;
}

const STORAGE_KEY = "pb-saved";

export function readSavedArticles(): SavedArticle[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedArticle[];
    return Array.isArray(raw) ? raw.filter((item) => typeof item?.slug === "string") : [];
  } catch {
    return [];
  }
}

export function writeSavedArticles(items: SavedArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Sem armazenamento disponível: o estado vale apenas para a sessão.
  }
}

export function SaveArticleButton({ article }: { article: SavedArticle }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readSavedArticles().some((item) => item.slug === article.slug));
  }, [article.slug]);

  const toggle = () => {
    const current = readSavedArticles();
    const next = saved
      ? current.filter((item) => item.slug !== article.slug)
      : [...current.filter((item) => item.slug !== article.slug), article];
    writeSavedArticles(next);
    setSaved(!saved);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      className={`relative z-10 flex h-10 items-center gap-2 border px-4 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
        saved
          ? "border-brand bg-brand-soft text-ink"
          : "border-line bg-surface text-muted hover:border-ink hover:text-ink"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
      </svg>
      {saved ? "Salvo neste dispositivo" : "Salvar para depois"}
    </button>
  );
}
