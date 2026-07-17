"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/config/categories";
import { Wordmark } from "@/components/Logo";

/** Menu lateral do celular: acessível por teclado, fecha com Esc e ao navegar. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:text-brand"
      >
        <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}

      <div
        id={menuId}
        ref={panelRef}
        hidden={!open}
        className="fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] overflow-y-auto border-r border-line bg-surface"
      >
        <div className="border-b border-line px-6 py-5">
          <Wordmark />
        </div>
        <nav aria-label="Menu principal" className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Editorias
          </p>
          <ul className="mt-2 flex flex-col">
            {categories.map((category) => (
              <li key={category.slug} className="border-b border-line last:border-b-0">
                <Link
                  href={`/categoria/${category.slug}`}
                  aria-current={pathname === `/categoria/${category.slug}` ? "page" : undefined}
                  className={`block border-l-2 py-3.5 pl-3 font-serif text-lg font-bold transition-colors duration-200 ${
                    pathname === `/categoria/${category.slug}`
                      ? "border-brand text-brand-dark"
                      : "border-transparent text-ink hover:text-brand-dark"
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t-2 border-ink px-6 py-5">
          <ul className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.14em]">
            {[
              { href: "/artigos", label: "Todos os artigos" },
              { href: "/buscar", label: "Buscar" },
              { href: "/sobre", label: "Sobre" },
              { href: "/contato", label: "Contato" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-2.5 text-muted transition-colors duration-200 hover:text-brand-dark"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
