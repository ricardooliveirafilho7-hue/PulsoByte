import Link from "next/link";

/** Estado vazio para buscas sem resultado, categorias sem artigos etc. */
export function EmptyState({
  title,
  message,
  actionHref = "/artigos",
  actionLabel = "Ver todos os artigos",
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <svg
        viewBox="0 0 24 24"
        className="mx-auto h-10 w-10 text-brand"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 14h4l2.5-6 4 9 2.5-6.5L17.5 14H21" />
      </svg>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
