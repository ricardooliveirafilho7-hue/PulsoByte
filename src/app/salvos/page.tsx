import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SavedArticlesList } from "@/components/interactive/SavedArticlesList";

export const metadata: Metadata = {
  title: "Artigos salvos",
  description:
    "Sua lista de leitura no PulsoByte: artigos salvos localmente neste dispositivo, sem conta e sem cadastro.",
  alternates: { canonical: "/salvos" },
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-[880px] px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Salvos" }]} />
      <header className="mt-8 max-w-3xl border-b-2 border-ink pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Lista de leitura</p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.015em] sm:text-5xl">
          Artigos salvos
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Tudo o que você marcou para ler depois. A lista fica gravada apenas neste
          dispositivo — nada é enviado aos nossos servidores.
        </p>
      </header>
      <div className="mt-10">
        <SavedArticlesList />
      </div>
    </div>
  );
}
