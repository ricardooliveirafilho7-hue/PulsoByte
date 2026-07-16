import type { TocEntry } from "@/lib/toc";

/** Lista de links do índice, compartilhada pelas versões mobile e desktop. */
export function TocList({ entries }: { entries: TocEntry[] }) {
  return (
    <ol className="space-y-1 text-sm">
      {entries.map((entry) => (
        <li key={entry.id} className={entry.level === 3 ? "pl-4" : ""}>
          <a
            href={`#${entry.id}`}
            className="block border-l-2 border-transparent py-1 pl-3 text-muted transition-colors duration-200 hover:border-brand hover:text-ink"
          >
            {entry.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Índice recolhível para o celular, sem JavaScript. */
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
