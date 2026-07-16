/** Formulário de busca por GET — funciona sem JavaScript. */
export function SearchForm({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/buscar" role="search" className="flex w-full max-w-xl gap-2">
      <label htmlFor="q" className="sr-only">
        Buscar artigos
      </label>
      <input
        id="q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Busque por título, tema ou categoria…"
        autoFocus={autoFocus}
        className="h-11 w-full rounded-lg border border-line bg-surface px-4 text-sm text-ink placeholder:text-muted focus:border-brand"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Buscar
      </button>
    </form>
  );
}
