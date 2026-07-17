"use client";

import { useEffect, useState } from "react";

/* ---------------------------------------------------------------------------
   Checklist de guia: o leitor marca etapas concluídas e o progresso fica
   salvo em localStorage — sem conta, sem servidor. Renderiza a lista completa
   no servidor; sem JavaScript, permanece uma lista legível.
--------------------------------------------------------------------------- */

export function GuideChecklist({ id, items }: { id: string; items: string[] }) {
  const storageKey = `pb-checklist:${id}`;
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as boolean[];
      if (Array.isArray(saved) && saved.length === items.length) setChecked(saved);
    } catch {
      // Estado salvo ilegível: recomeça do zero.
    }
  }, [storageKey, items.length]);

  const toggle = (index: number) => {
    const next = checked.map((value, i) => (i === index ? !value : value));
    setChecked(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Sem armazenamento, o progresso vale apenas para a sessão.
    }
  };

  const done = checked.filter(Boolean).length;

  return (
    <section className="border-y-2 border-ink bg-surface px-6 py-6 font-sans">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="!mt-0 text-[11px] font-bold uppercase tracking-[0.18em]">
          Checklist final
        </h2>
        <p className="text-xs font-semibold text-muted" aria-live="polite">
          {done} de {items.length}
        </p>
      </div>
      <ul className="mt-4 space-y-1 !pl-0">
        {items.map((item, index) => (
          <li key={index} className="!list-none">
            <label className="flex cursor-pointer items-start gap-3 py-1.5 text-[0.95rem] leading-relaxed">
              <input
                type="checkbox"
                checked={checked[index] ?? false}
                onChange={() => toggle(index)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
              />
              <span className={checked[index] ? "text-muted line-through" : ""}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        O progresso fica salvo apenas neste dispositivo.
      </p>
    </section>
  );
}
