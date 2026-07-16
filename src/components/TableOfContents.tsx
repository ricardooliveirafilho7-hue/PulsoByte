import type { TocEntry } from "@/lib/toc";

/** Índice do artigo. Usa <details>: recolhível no celular sem JavaScript. */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 2) return null;

  return (
    <details className="group rounded-xl border border-line bg-brand-soft/50 open:pb-4" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
        Neste artigo
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
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
        <ol className="space-y-1 px-5 text-sm">
          {entries.map((entry) => (
            <li key={entry.id} className={entry.level === 3 ? "pl-4" : ""}>
              <a
                href={`#${entry.id}`}
                className="block py-1 text-muted hover:text-brand-dark hover:underline"
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
