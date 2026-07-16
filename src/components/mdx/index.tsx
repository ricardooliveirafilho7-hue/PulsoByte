import type { ReactNode } from "react";
import Image from "next/image";
import { site } from "@/config/site";

/* ---------------------------------------------------------------------------
   Componentes de conteúdo para uso dentro dos artigos MDX.
   API consistente: `title` para o cabeçalho do bloco e `children` para o corpo.
--------------------------------------------------------------------------- */

const calloutStyles = {
  info: { border: "border-brand", bg: "bg-brand-soft", label: "Nota" },
  warning: { border: "border-amber-500", bg: "bg-amber-50", label: "Atenção" },
  tip: { border: "border-cyan", bg: "bg-cyan/10", label: "Dica" },
} as const;

/** Aviso destacado no meio do texto. Tipos: info (padrão), warning, tip. */
export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof calloutStyles;
  title?: string;
  children: ReactNode;
}) {
  const style = calloutStyles[type];
  return (
    <aside className={`rounded-xl border-l-4 ${style.border} ${style.bg} px-5 py-4 font-sans text-[0.95rem]`}>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink">
        {title ?? style.label}
      </p>
      <div className="[&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** Lista dos pontos principais do artigo. */
export function KeyTakeaways({ title = "Principais pontos", items }: { title?: string; items: string[] }) {
  return (
    <aside className="rounded-xl border border-line bg-surface p-6 font-sans">
      <h2 className="!mt-0 text-base font-bold">{title}</h2>
      <ul className="mt-3 space-y-2 !pl-0 text-[0.95rem]">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 !list-none">
            <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-brand">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Prós e contras lado a lado. */
export function ProsAndCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  const column = (heading: string, items: string[], mark: string, markClass: string) => (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="!mt-0 text-sm font-bold uppercase tracking-widest">{heading}</h3>
      <ul className="mt-3 space-y-2 !pl-0 text-[0.95rem]">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 !list-none">
            <span aria-hidden="true" className={`mt-0.5 shrink-0 font-bold ${markClass}`}>
              {mark}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid gap-4 font-sans sm:grid-cols-2">
      {column("Prós", pros, "+", "text-brand")}
      {column("Contras", cons, "−", "text-muted")}
    </div>
  );
}

/** Tabela comparativa com rolagem horizontal em telas pequenas. */
export function ComparisonTable({
  caption,
  headers,
  rows,
}: {
  caption?: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="table-wrap">
      <table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lista de fontes citadas no artigo. */
export function Sources({ items }: { items: { label: string; url: string }[] }) {
  return (
    <aside className="rounded-xl border border-line bg-surface p-6 font-sans">
      <h2 className="!mt-0 text-base font-bold">Fontes</h2>
      <ul className="mt-3 space-y-2 !pl-0 text-sm">
        {items.map((source, index) => (
          <li key={index} className="!list-none">
            <a
              href={source.url}
              rel="noopener noreferrer"
              target="_blank"
              className="text-brand-dark underline hover:text-brand"
            >
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Imagem com legenda dentro do artigo. */
export function Figure({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure>
      <Image src={src} alt={alt} width={width} height={height} className="w-full" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Citação com autoria. */
export function Quote({ author, role, children }: { author?: string; role?: string; children: ReactNode }) {
  return (
    <figure className="rounded-xl bg-brand-soft px-6 py-5">
      <blockquote className="!border-0 !p-0 text-lg !not-italic font-medium text-ink">
        {children}
      </blockquote>
      {author && (
        <figcaption className="mt-3 font-sans text-sm text-muted">
          — <span className="font-semibold text-ink">{author}</span>
          {role && `, ${role}`}
        </figcaption>
      )}
    </figure>
  );
}

/** Passo a passo numerado. */
export function StepByStep({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <ol className="!list-none space-y-4 !pl-0 font-sans">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
          >
            {index + 1}
          </span>
          <div>
            <h3 className="!mt-0 text-base font-bold">{step.title}</h3>
            <p className="mt-1 text-[0.95rem] text-muted">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Posição reservada de anúncio.
 * Com o AdSense desativado (variável de ambiente vazia) não renderiza nada:
 * sem scripts, sem espaço vazio e sem mudança de layout.
 */
export function AdSlot({ slot }: { slot: string }) {
  if (!site.adsenseClient) return null;

  return (
    <div className="my-8 text-center font-sans">
      <p className="mb-1 text-[0.65rem] uppercase tracking-widest text-muted">Publicidade</p>
      <ins
        className="adsbygoogle block"
        data-ad-client={site.adsenseClient}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script
        dangerouslySetInnerHTML={{ __html: "(adsbygoogle=window.adsbygoogle||[]).push({});" }}
      />
    </div>
  );
}
