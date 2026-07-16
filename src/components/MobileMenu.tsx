"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/config/categories";

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
        className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-brand-soft"
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
          className="fixed inset-0 z-40 bg-ink/40"
        />
      )}

      <div
        id={menuId}
        ref={panelRef}
        hidden={!open}
        className="fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-l border-line bg-surface p-6 shadow-xl"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Categorias</p>
        <nav aria-label="Menu principal" className="mt-3">
          <ul className="flex flex-col">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-brand-soft hover:text-brand-dark"
                >
                  {category.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <hr className="my-4 border-line" />
        <ul className="flex flex-col text-sm">
          {[
            { href: "/artigos", label: "Todos os artigos" },
            { href: "/sobre", label: "Sobre" },
            { href: "/contato", label: "Contato" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-3 py-2.5 text-muted hover:bg-brand-soft hover:text-brand-dark"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
