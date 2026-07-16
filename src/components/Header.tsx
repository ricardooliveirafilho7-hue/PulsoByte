import Link from "next/link";
import { categories } from "@/config/categories";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="PulsoByte — página inicial" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Categorias" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-brand-soft hover:text-brand-dark"
                >
                  {category.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/buscar"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-brand-soft"
            aria-label="Buscar artigos"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
