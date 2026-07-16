import type { ReactNode } from "react";
import Image from "next/image";
import { site } from "@/config/site";

/* ---------------------------------------------------------------------------
   Componentes de conteúdo para uso dentro dos artigos MDX.
   Estética editorial: regras tipográficas e hairlines no lugar de caixas.
--------------------------------------------------------------------------- */

const calloutStyles = {
  info: { rule: "border-brand", label: "Nota" },
  warning: { rule: "border-amber-500", label: "Atenção" },
  tip: { rule: "border-cyan", label: "Dica" },
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
    <aside className={`border-l-2 ${style.rule} bg-surface px-6 py-5 font-sans text-[0.95rem]`}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
        {title ?? style.label}
      </p>
      <div className="leading-relaxed [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** Lista dos pontos principais do artigo. */
export function KeyTakeaways({
  title = "Principais pontos",
  items,
}: {
  title?: string;
  items: string[];
}) {
  return (
    <aside className="border-y-2 border-ink bg-surface px-6 py-6 font-sans">
      <h2 className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em]">{title}</h2>
      <ul className="mt-4 space-y-3 !pl-0 text-[0.95rem] leading-relaxed">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 !list-none">
            <span aria-hidden="true" className="mt-[3px] h-3 w-3 shrink-0 bg-brand" />
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
    <div className="bg-surface p-6">
      <h3 className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em]">{heading}</h3>
      <ul className="mt-4 space-y-2.5 !pl-0 text-[0.95rem] leading-relaxed">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 !list-none">
            <span aria-hidden="true" className={`shrink-0 font-bold ${markClass}`}>
              {mark}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid gap-px border-y-2 border-ink bg-line font-sans sm:grid-cols-2">
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
    <aside className="border-t-2 border-ink pt-5 font-sans">
      <h2 className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em]">Fontes</h2>
      <ul className="mt-3 space-y-2 !pl-0 text-sm">
        {items.map((source, index) => (
          <li key={index} className="!list-none">
            <a
              href={source.url}
              rel="noopener noreferrer"
              target="_blank"
              className="text-ink underline decoration-brand decoration-[1.5px] underline-offset-4 transition-colors duration-200 hover:text-brand-dark"
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
export function Quote({
  author,
  role,
  children,
}: {
  author?: string;
  role?: string;
  children: ReactNode;
}) {
  return (
    <figure className="border-y border-line py-6 text-center">
      <span aria-hidden="true" className="font-serif text-5xl leading-none text-brand">
        “
      </span>
      <blockquote className="!mt-1 !border-0 !p-0 font-serif text-xl !not-italic leading-relaxed text-ink sm:text-2xl">
        {children}
      </blockquote>
      {author && (
        <figcaption className="mt-4 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          {author}
          {role && <span className="font-medium normal-case tracking-normal"> — {role}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** Passo a passo numerado. */
export function StepByStep({ steps }: { steps: { title: string; description: string }[] }) {
  return (
    <ol className="!list-none border-t-2 border-ink !pl-0 font-sans">
      {steps.map((step, index) => (
        <li key={index} className="!mt-0 flex gap-5 border-b border-line py-5">
          <span
            aria-hidden="true"
            className="font-serif text-3xl font-bold leading-none text-brand"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="!mt-0 text-base font-bold">{step.title}</h3>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{step.description}</p>
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
