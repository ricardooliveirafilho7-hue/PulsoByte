import Link from "next/link";

/** Paginação por parâmetro `?page=`, preservando outros filtros da URL. */
export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const linkClass =
    "flex h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink hover:border-brand hover:text-brand-dark";

  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link href={hrefFor(currentPage - 1)} className={linkClass} rel="prev">
          ← Anterior
        </Link>
      )}
      <p className="px-3 text-sm text-muted">
        Página {currentPage} de {totalPages}
      </p>
      {currentPage < totalPages && (
        <Link href={hrefFor(currentPage + 1)} className={linkClass} rel="next">
          Próxima →
        </Link>
      )}
    </nav>
  );
}
