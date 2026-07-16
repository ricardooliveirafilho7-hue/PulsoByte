import Link from "next/link";
import { LogoMark } from "@/components/Logo";

/** Estado vazio para buscas sem resultado, editorias sem artigos etc. */
export function EmptyState({
  title,
  message,
  actionHref = "/artigos",
  actionLabel = "Ver todos os artigos",
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="border-y-2 border-ink px-6 py-16 text-center">
      <LogoMark className="mx-auto h-6 w-auto text-muted" />
      <h2 className="mt-6 font-serif text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{message}</p>
      <Link
        href={actionHref}
        className="mt-8 inline-flex h-11 items-center bg-ink px-6 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-brand"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
