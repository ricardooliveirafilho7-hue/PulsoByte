/** Símbolo da marca: linha de pulso sobre pixels, em azul. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#4F63FF" />
      <rect x="20" y="20" width="4" height="4" rx="1" fill="#20C9D6" />
      <rect x="25" y="15" width="3" height="3" rx="0.75" fill="#20C9D6" opacity="0.7" />
      <path
        d="M5 17h5l2.5-7 4 12 2.5-7.5L20.5 17H27"
        stroke="#FFFFFF"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Versão horizontal do logotipo: símbolo + “Pulso” escuro e “Byte” azul. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-xl font-bold tracking-tight">
        <span className="text-ink">Pulso</span>
        <span className="text-brand">Byte</span>
      </span>
    </span>
  );
}
