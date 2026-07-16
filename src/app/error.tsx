"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-brand">Erro inesperado</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Algo deu errado</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        Ocorreu um problema ao carregar esta página. Tente novamente — se persistir, volte ao
        início.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink hover:border-brand hover:text-brand-dark"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
