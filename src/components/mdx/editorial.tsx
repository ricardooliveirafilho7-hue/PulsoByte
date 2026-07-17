import type { ReactNode } from "react";

/* ---------------------------------------------------------------------------
   Componentes editoriais para artigos MDX — todos Server Components, sem
   JavaScript no cliente. Regras tipográficas e hairlines no lugar de caixas;
   cor sempre acompanhada de rótulo textual. Ver docs/article-formats.md.
--------------------------------------------------------------------------- */

function BlockLabel({ children }: { children: ReactNode }) {
  return (
    <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">{children}</p>
  );
}

/** Resumo de abertura: três ou quatro pontos para quem tem 30 segundos. */
export function QuickSummary({
  title = "Em 30 segundos",
  items,
}: {
  title?: string;
  items: string[];
}) {
  return (
    <aside className="border-y-2 border-ink bg-surface px-6 py-6 font-sans">
      <BlockLabel>{title}</BlockLabel>
      <ul className="mt-4 space-y-3 !pl-0 text-[0.95rem] leading-relaxed">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 !list-none">
            <span aria-hidden="true" className="mt-[7px] h-[3px] w-4 shrink-0 bg-brand" />
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Definição de um termo técnico, destacada do fluxo. */
export function Definition({ term, children }: { term: string; children: ReactNode }) {
  return (
    <aside className="border-l-2 border-violet bg-violet-soft px-6 py-5 font-sans text-[0.95rem]">
      <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-violet">
        Definição
      </p>
      <p className="mt-2 font-serif text-lg font-bold">{term}</p>
      <div className="mt-1.5 leading-relaxed [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** Contexto complementar que não interrompe a leitura principal. */
export function ContextBox({
  title = "Contexto",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="border-l-2 border-line bg-surface px-6 py-5 font-sans text-[0.95rem]">
      <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="mt-2 leading-relaxed text-ink-soft [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** Por que a informação importa para o leitor. */
export function WhyItMatters({ children }: { children: ReactNode }) {
  return (
    <aside className="border-l-2 border-brand bg-brand-faint px-6 py-5 font-sans text-[0.95rem]">
      <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-dark">
        Por que importa
      </p>
      <div className="mt-2 leading-relaxed [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** O que mudou de fato — para notícias e atualizações. */
export function WhatChanged({ children }: { children: ReactNode }) {
  return (
    <aside className="border-l-2 border-amber bg-amber-soft px-6 py-5 font-sans text-[0.95rem]">
      <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-amber">
        O que mudou
      </p>
      <div className="mt-2 leading-relaxed [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** Perguntas frequentes — <details> nativo, funciona sem JavaScript. */
export function FAQ({
  title = "Perguntas frequentes",
  items,
}: {
  title?: string;
  items: { question: string; answer: string }[];
}) {
  return (
    <section className="border-t-2 border-ink font-sans">
      <h2 className="!mt-0 pt-5 text-[11px] font-bold uppercase tracking-[0.18em]">{title}</h2>
      <div className="mt-3">
        {items.map((item, index) => (
          <details key={index} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 font-serif text-xl leading-none text-muted transition-transform duration-150 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-5 text-[0.95rem] leading-relaxed text-ink-soft">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Linha do tempo de eventos, em lista semântica. */
export function Timeline({ items }: { items: { date: string; title: string; description?: string }[] }) {
  return (
    <ol className="!list-none border-l-2 border-line !pl-0 font-sans">
      {items.map((item, index) => (
        <li key={index} className="!mt-0 relative pb-6 pl-6 last:pb-0">
          <span
            aria-hidden="true"
            className="absolute -left-[5px] top-[7px] h-2 w-2 bg-brand"
          />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{item.date}</p>
          <p className="mt-1 text-base font-bold">{item.title}</p>
          {item.description && (
            <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Histórico de alterações relevantes do artigo. */
export function UpdateHistory({ items }: { items: { date: string; change: string }[] }) {
  return (
    <aside className="border-t border-line pt-4 font-sans">
      <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
        Histórico de atualizações
      </p>
      <ul className="mt-3 space-y-2 !pl-0 text-sm text-ink-soft">
        {items.map((item, index) => (
          <li key={index} className="!list-none flex gap-3">
            <span className="shrink-0 font-semibold text-muted">{item.date}</span>
            <span>{item.change}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Nota de correção transparente. */
export function CorrectionNote({ date, children }: { date: string; children: ReactNode }) {
  return (
    <aside className="border-l-2 border-red bg-red-soft px-6 py-5 font-sans text-[0.95rem]">
      <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-red">
        Correção — {date}
      </p>
      <div className="mt-2 leading-relaxed [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** Pré-requisitos de um guia: o que ter em mãos antes de começar. */
export function Requirements({
  items,
  time,
  level,
}: {
  items: string[];
  time?: string;
  level?: string;
}) {
  return (
    <aside className="border-y-2 border-ink bg-surface px-6 py-6 font-sans">
      <BlockLabel>Antes de começar</BlockLabel>
      {(time || level) && (
        <p className="mt-2 text-sm text-muted">
          {[time && `Tempo: ${time}`, level && `Nível: ${level}`].filter(Boolean).join(" · ")}
        </p>
      )}
      <ul className="mt-4 space-y-2.5 !pl-0 text-[0.95rem] leading-relaxed">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 !list-none">
            <span aria-hidden="true" className="mt-[3px] shrink-0 font-bold text-green">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Erros comuns e como resolver — para o fim de guias. */
export function Troubleshooting({
  items,
}: {
  items: { problem: string; solution: string }[];
}) {
  return (
    <section className="border-t-2 border-ink font-sans">
      <h2 className="!mt-0 pt-5 text-[11px] font-bold uppercase tracking-[0.18em]">
        Se algo der errado
      </h2>
      <dl className="mt-4">
        {items.map((item, index) => (
          <div key={index} className="border-b border-line py-4 last:border-b-0">
            <dt className="text-base font-bold">{item.problem}</dt>
            <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">{item.solution}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Veredito rápido de comparativo — a resposta antes dos detalhes. */
export function QuickVerdict({ children }: { children: ReactNode }) {
  return (
    <aside className="border-y-2 border-ink bg-surface px-6 py-6 font-sans">
      <BlockLabel>Veredito rápido</BlockLabel>
      <div className="mt-3 font-serif text-lg leading-relaxed [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}

/** Para quem é cada opção de um comparativo. */
export function BestFor({ items }: { items: { option: string; audience: string }[] }) {
  return (
    <div className="grid gap-px border-y-2 border-ink bg-line font-sans sm:grid-cols-2">
      {items.map((item, index) => (
        <div key={index} className="bg-surface p-6">
          <p className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-dark">
            Melhor para
          </p>
          <p className="mt-2 font-serif text-lg font-bold">{item.option}</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">{item.audience}</p>
        </div>
      ))}
    </div>
  );
}

/** Conclusão assinalada de análise ou comparativo. */
export function FinalVerdict({ children }: { children: ReactNode }) {
  return (
    <aside className="rule-double pt-5 font-sans">
      <BlockLabel>Conclusão</BlockLabel>
      <div className="mt-3 font-serif text-lg leading-relaxed [&>*+*]:mt-2">{children}</div>
    </aside>
  );
}
