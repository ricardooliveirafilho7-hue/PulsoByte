"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   Painel de preferências de leitura.
   Persistido em localStorage ("pb-prefs") e aplicado como data-attributes no
   <html> — o script inline do layout aplica os valores antes da pintura, este
   componente apenas edita e re-aplica. Os dados nunca saem do dispositivo.
--------------------------------------------------------------------------- */

export interface Prefs {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "default" | "large";
  width: "comfortable" | "wide";
  motion: "full" | "reduced";
  focus: "off" | "on";
}

const DEFAULTS: Prefs = {
  theme: "system",
  fontSize: "default",
  width: "comfortable",
  motion: "full",
  focus: "off",
};

const STORAGE_KEY = "pb-prefs";

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Prefs>;
    return { ...DEFAULTS, ...raw };
  } catch {
    return DEFAULTS;
  }
}

export function applyPrefs(prefs: Prefs) {
  const root = document.documentElement;
  const dark =
    prefs.theme === "dark" ||
    (prefs.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";

  const set = (name: string, value: string, defaultValue: string) => {
    if (value === defaultValue) delete root.dataset[name];
    else root.dataset[name] = value;
  };
  set("fontsize", prefs.fontSize, "default");
  set("width", prefs.width, "comfortable");
  set("motion", prefs.motion, "full");
  set("focus", prefs.focus, "off");
}

function Choice<Value extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: Value;
  options: { value: Value; label: string }[];
  onChange: (value: Value) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
        {legend}
      </legend>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex h-9 cursor-pointer items-center border px-3 text-xs font-semibold transition-colors duration-150 ${
              value === option.value
                ? "border-brand bg-brand-soft text-ink"
                : "border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ReadingPreferences() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  // Espelho síncrono do estado: garante que cliques em sequência rápida não
  // usem preferências desatualizadas.
  const prefsRef = useRef<Prefs>(DEFAULTS);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    const stored = readPrefs();
    prefsRef.current = stored;
    setPrefs(stored);
  }, []);

  // Com o tema em "Sistema", acompanha mudanças da preferência do SO.
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPrefs(prefs);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const update = useCallback((partial: Partial<Prefs>) => {
    const next = { ...prefsRef.current, ...partial };
    prefsRef.current = next;
    setPrefs(next);
    applyPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Sem armazenamento disponível, a preferência vale só para a sessão.
    }
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center text-ink transition-colors duration-200 hover:text-brand-dark"
      >
        <span className="sr-only">Preferências de leitura</span>
        <span aria-hidden="true" className="font-serif text-[1.15rem] font-bold leading-none">
          Aa
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        role="group"
        aria-label="Preferências de leitura"
        className="absolute right-0 top-full z-50 mt-2 w-72 space-y-5 border border-line bg-surface p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      >
        <Choice
          legend="Tema"
          name="pb-theme"
          value={prefs.theme}
          options={[
            { value: "light", label: "Claro" },
            { value: "dark", label: "Escuro" },
            { value: "system", label: "Sistema" },
          ]}
          onChange={(theme) => update({ theme })}
        />
        <Choice
          legend="Tamanho do texto"
          name="pb-fontsize"
          value={prefs.fontSize}
          options={[
            { value: "small", label: "Pequeno" },
            { value: "default", label: "Padrão" },
            { value: "large", label: "Grande" },
          ]}
          onChange={(fontSize) => update({ fontSize })}
        />
        <Choice
          legend="Largura de leitura"
          name="pb-width"
          value={prefs.width}
          options={[
            { value: "comfortable", label: "Confortável" },
            { value: "wide", label: "Ampla" },
          ]}
          onChange={(width) => update({ width })}
        />
        <Choice
          legend="Movimento"
          name="pb-motion"
          value={prefs.motion}
          options={[
            { value: "full", label: "Completo" },
            { value: "reduced", label: "Reduzido" },
          ]}
          onChange={(motion) => update({ motion })}
        />
        <Choice
          legend="Modo foco"
          name="pb-focus"
          value={prefs.focus}
          options={[
            { value: "off", label: "Desligado" },
            { value: "on", label: "Ligado" },
          ]}
          onChange={(focus) => update({ focus })}
        />
        <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
          As preferências ficam salvas apenas neste dispositivo.
        </p>
      </div>
    </div>
  );
}
