import Link from "next/link";
import { site } from "@/config/site";
import { Wordmark } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { DesktopNav } from "@/components/DesktopNav";
import { ReadingPreferences } from "@/components/preferences/ReadingPreferences";

function SavedLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/salvos"
      aria-label="Artigos salvos"
      className={`hidden h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:text-brand-dark sm:flex ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
      </svg>
    </Link>
  );
}

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
      <div className="hidden border-b border-line sm:block" data-focus-hide>
        <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-between px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:px-6 lg:px-8">
          <span>{site.slogan.replace(/\.$/, "")}</span>
          <div className="hidden items-center gap-6 sm:flex">
            <Link href="/sobre" className="transition-colors duration-200 hover:text-ink">
              Sobre
            </Link>
            <Link
              href="/politica-editorial"
              className="transition-colors duration-200 hover:text-ink"
            >
              Política Editorial
            </Link>
            <Link href="/contato" className="transition-colors duration-200 hover:text-ink">
              Contato
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="mx-auto grid max-w-[1280px] grid-cols-[5.5rem_1fr_5.5rem] sm:grid-cols-[8.25rem_1fr_8.25rem] items-center px-4 py-2.5 sm:px-6 sm:py-4 lg:px-8 lg:py-7">
        <div className="flex items-center justify-self-start">
          <MobileMenu />
        </div>
        <Link
          href="/"
          aria-label="PulsoByte — página inicial"
          className="justify-self-center text-ink"
        >
          <Wordmark size="masthead" />
        </Link>
        <div className="flex items-center justify-self-end">
          <ReadingPreferences />
          <SavedLink />
          <SearchLink />
        </div>
      </div>

      {/* Navegação de editorias */}
      <div data-focus-hide>
        <DesktopNav />
      </div>

      <div className="rule-double" />
    </header>
  );
}
