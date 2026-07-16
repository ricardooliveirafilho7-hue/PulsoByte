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
    "flex h-11 items-center gap-1 border-b-2 border-transparent px-1 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-brand hover:text-brand-dark";

  return (
    <nav
      aria-label="Paginação"
      className="mt-12 flex items-center justify-between border-t-2 border-ink pt-2"
    >
      <div>
        {currentPage > 1 && (
          <Link href={hrefFor(currentPage - 1)} className={linkClass} rel="prev">
            ← Anterior
          </Link>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Página {currentPage} de {totalPages}
      </p>
      <div>
        {currentPage < totalPages && (
          <Link href={hrefFor(currentPage + 1)} className={linkClass} rel="next">
            Próxima →
          </Link>
        )}
      </div>
    </nav>
  );
}
