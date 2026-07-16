"use client";

import { useState } from "react";

const icon = "h-[18px] w-[18px]";

/** Barra de compartilhamento do artigo: copiar link e redes, sem SDKs externos. */
export function ShareRail({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (http/permissão): mantém o link acessível na URL.
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const linkClass =
    "flex h-10 w-10 items-center justify-center border border-line bg-surface text-muted transition-colors duration-200 hover:border-ink hover:text-ink";

  return (
    <div className="flex gap-2 lg:flex-col" role="group" aria-label="Compartilhar artigo">
      <button
        type="button"
        onClick={copy}
        className={linkClass}
        aria-label={copied ? "Link copiado" : "Copiar link do artigo"}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className={`${icon} text-brand`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m4 12.5 5 5L20 6.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className={icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </svg>
        )}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label="Compartilhar no X"
      >
        <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden="true">
          <path d="M13.9 10.6 21.2 2h-1.7l-6.4 7.4L8 2H2.1l7.7 11.2L2.1 22h1.7l6.7-7.8 5.4 7.8H22l-8.1-11.4Zm-2.4 2.8-.8-1.1-6.2-8.9h2.7l5 7.2.8 1.1 6.5 9.3h-2.7l-5.3-7.6Z" />
        </svg>
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label="Compartilhar no WhatsApp"
      >
        <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.2-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.2 2.2-.2 3.9a12 12 0 0 0 4.6 4.3c1.7.8 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
        </svg>
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label="Compartilhar no LinkedIn"
      >
        <svg viewBox="0 0 24 24" className={icon} fill="currentColor" aria-hidden="true">
          <path d="M20.4 3H3.6A.6.6 0 0 0 3 3.6v16.8c0 .3.3.6.6.6h16.8c.3 0 .6-.3.6-.6V3.6a.6.6 0 0 0-.6-.6ZM8.3 18.4H5.7v-8.6h2.6v8.6ZM7 8.6a1.6 1.6 0 1 1 0-3.1 1.6 1.6 0 0 1 0 3.1Zm11.4 9.8h-2.7v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3h-2.6v-8.6h2.5v1.2h.1a2.8 2.8 0 0 1 2.5-1.4c2.7 0 3.2 1.8 3.2 4.1v4.7Z" />
        </svg>
      </a>
    </div>
  );
}
