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
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: title }]} />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>
      <div className="article-body mt-8">{children}</div>
    </div>
  );
}
