"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  readSavedArticles,
  writeSavedArticles,
  type SavedArticle,
} from "@/components/interactive/SaveArticleButton";
import { getCategory } from "@/config/categories";
import { formatDate } from "@/lib/format";

/** Lista de artigos salvos no dispositivo (localStorage), com remoção. */
export function SavedArticlesList() {
  const [items, setItems] = useState<SavedArticle[] | null>(null);

  useEffect(() => {
    setItems(readSavedArticles().reverse());
  }, []);

  const remove = (slug: string) => {
    const next = (items ?? []).filter((item) => item.slug !== slug);
    setItems(next);
    writeSavedArticles([...next].reverse());
  };

  // Antes da hidratação (e sem JavaScript) mostra uma explicação estática.
  if (items === null) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        Carregando a sua lista… Os artigos salvos ficam gravados apenas neste navegador.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border-y-2 border-ink px-6 py-16 text-center">
        <h2 className="font-serif text-2xl font-bold">Nenhum artigo salvo por aqui</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Use o botão “Salvar para depois” na abertura de qualquer artigo. A lista fica
          gravada apenas neste dispositivo — sem conta, sem cadastro.
        </p>
        <Link
          href="/artigos"
          className="mt-8 inline-flex h-11 items-center bg-ink px-6 text-xs font-bold uppercase tracking-[0.14em] text-background transition-colors duration-200 hover:bg-brand"
        >
          Ver todos os artigos
        </Link>
      </div>
    );
  }

  return (
    <ul className="border-t border-line">
      {items.map((item) => (
        <li
          key={item.slug}
          className="group relative grid grid-cols-[88px_1fr_auto] items-start gap-4 border-b border-line py-5 sm:grid-cols-[112px_1fr_auto] sm:gap-6"
        >
          <div className="relative aspect-square overflow-hidden bg-paper-deep">
            <Image
              src={item.coverImage}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              {getCategory(item.category)?.shortName ?? item.category}
            </p>
            <h2 className="mt-1.5 font-serif text-lg font-bold leading-snug sm:text-xl">
              <Link href={`/artigos/${item.slug}`} className="after:absolute after:inset-0">
                <span className="transition-colors duration-200 group-hover:text-brand-dark">
                  {item.title}
                </span>
              </Link>
            </h2>
            <p className="mt-1.5 text-xs text-muted">
              <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
            </p>
          </div>
          <button
            type="button"
            onClick={() => remove(item.slug)}
            className="relative z-10 flex h-11 w-11 items-center justify-center text-muted transition-colors duration-200 hover:text-red"
          >
            <span className="sr-only">Remover “{item.title}” dos salvos</span>
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
