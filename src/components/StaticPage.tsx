import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

/** Casca comum das páginas institucionais e de políticas. */
export function StaticPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: title }]} />
      <header className="mt-8 border-b-2 border-ink pb-8">
        <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>
      </header>
      <div className="article-body mt-8">{children}</div>
    </div>
  );
}
