import Link from "next/link";
import { site } from "@/config/site";
import { Wordmark } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { DesktopNav } from "@/components/DesktopNav";

function SearchLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/buscar"
      aria-label="Buscar artigos"
      className={`flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:text-brand ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    </Link>
  );
}

export function Header() {
  return (
    <header className="bg-surface">
      {/* Fio superior com o slogan */}
      <div className="hidden border-b border-line sm:block">
        <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:px-6 lg:px-8">
          <span>{site.slogan.replace(/\.$/, "")}</span>
          <div className="hidden items-center gap-6 sm:flex">
            <Link href="/sobre" className="transition-colors duration-200 hover:text-ink">
              Sobre
            </Link>
            <Link href="/contato" className="transition-colors duration-200 hover:text-ink">
              Contato
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="mx-auto grid max-w-[1280px] grid-cols-[2.75rem_1fr_2.75rem] items-center px-4 py-2.5 sm:px-6 sm:py-4 lg:grid-cols-3 lg:px-8 lg:py-7">
        <MobileMenu />
        <div className="hidden lg:block" aria-hidden="true" />
        <Link
          href="/"
          aria-label="PulsoByte — página inicial"
          className="justify-self-center text-ink"
        >
          <Wordmark size="masthead" />
        </Link>
        <SearchLink className="justify-self-end" />
      </div>

      {/* Navegação de editorias */}
      <DesktopNav />

      <div className="rule-double" />
    </header>
  );
}
