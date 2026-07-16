"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/config/categories";

export function DesktopNav() {
  const pathname = usePathname();
  const linkClass = (active: boolean, muted = false) =>
    `block border-b-2 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-200 ${
      active
        ? "border-brand text-brand-dark"
        : `border-transparent ${muted ? "text-muted" : "text-ink"} hover:border-brand hover:text-brand-dark`
    }`;

  return (
    <nav aria-label="Editorias" className="hidden border-t border-line lg:block">
      <ul className="mx-auto flex max-w-[1280px] items-center justify-center gap-9 px-8">
        {categories.map((category) => {
          const href = `/categoria/${category.slug}`;
          return (
            <li key={category.slug}>
              <Link href={href} aria-current={pathname === href ? "page" : undefined} className={linkClass(pathname === href)}>
                {category.shortName}
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/artigos" aria-current={pathname === "/artigos" ? "page" : undefined} className={linkClass(pathname === "/artigos", true)}>
            Tudo
          </Link>
        </li>
      </ul>
    </nav>
  );
}
