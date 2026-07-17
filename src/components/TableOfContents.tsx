"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/toc";

/**
 * Lista de links do índice com destaque da seção atual.
 * O destaque é progressivo: sem JavaScript o índice continua uma lista de
 * âncoras perfeitamente utilizável.
 */
export function TocList({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;

    // A seção ativa é a do último título acima do terço superior da tela.
    const observer = new IntersectionObserver(
      () => {
        const line = window.innerHeight / 3;
        let current: string | null = null;
        for (const heading of headings) {
          if (heading.getBoundingClientRect().top <= line) current = heading.id;
        }
        setActiveId(current ?? headings[0]?.id ?? null);
      },
      { rootMargin: "-10% 0px -60% 0px", threshold: [0, 1] }
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [entries]);

  return (
    <ol className="space-y-1 text-sm">
      {entries.map((entry) => {
        const active = entry.id === activeId;
        return (
          <li key={entry.id} className={entry.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${entry.id}`}
              aria-current={active ? "true" : undefined}
              className={`block border-l-2 py-1 pl-3 transition-colors duration-200 ${
                active
                  ? "border-brand font-semibold text-ink"
                  : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              {entry.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Índice recolhível para o celular — <details> nativo, funciona sem JavaScript. */
export function MobileToc({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 2) return null;

  return (
    <details className="group border-y border-line open:pb-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-4 text-xs font-bold uppercase tracking-[0.16em] [&::-webkit-details-marker]:hidden">
        Neste artigo
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-muted transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <nav aria-label="Índice do artigo">
        <TocList entries={entries} />
      </nav>
    </details>
  );
}
