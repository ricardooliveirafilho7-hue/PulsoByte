import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <LogoMark className="h-7 w-auto text-ink" />
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-brand">Erro 404</p>
      <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
        Página não encontrada
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
        O endereço pode ter mudado ou nunca existiu. Sem ruído: volte ao início ou busque o que
        você procura.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center bg-ink px-6 text-xs font-bold uppercase tracking-[0.14em] text-background transition-colors duration-200 hover:bg-brand"
        >
          Ir para o início
        </Link>
        <Link
          href="/buscar"
          className="inline-flex h-11 items-center border border-ink px-6 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-brand hover:text-brand-dark"
        >
          Buscar artigos
        </Link>
      </div>
    </div>
  );
}
