/** Formulário de busca por GET — funciona sem JavaScript. */
export function SearchForm({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/buscar" role="search" className="flex w-full items-end gap-3">
      <label htmlFor="q" className="sr-only">
        Buscar artigos
      </label>
      <input
        id="q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Busque por título, tema ou editoria…"
        autoFocus={autoFocus}
        className="h-11 w-full border-0 border-b-2 border-ink bg-transparent px-0 font-serif text-lg text-ink placeholder:font-sans placeholder:text-sm placeholder:text-muted focus:border-brand focus:outline-none"
      />
      <button
        type="submit"
        className="h-11 shrink-0 bg-ink px-5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-brand"
      >
        Buscar
      </button>
    </form>
  );
}
