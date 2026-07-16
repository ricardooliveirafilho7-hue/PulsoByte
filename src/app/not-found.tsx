import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <LogoMark className="h-12 w-12" />
      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-brand">Erro 404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Página não encontrada
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        O endereço pode ter mudado ou nunca existiu. Sem ruído: volte ao início ou busque o que
        você procura.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Ir para o início
        </Link>
        <Link
          href="/buscar"
          className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink hover:border-brand hover:text-brand-dark"
        >
          Buscar artigos
        </Link>
      </div>
    </div>
  );
}
