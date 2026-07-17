"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Erro inesperado</p>
      <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
        Algo deu errado
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
        Ocorreu um problema ao carregar esta página. Tente novamente — se persistir, volte ao
        início.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center bg-ink px-6 text-xs font-bold uppercase tracking-[0.14em] text-background transition-colors duration-200 hover:bg-brand"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center border border-ink px-6 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-brand hover:text-brand-dark"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
