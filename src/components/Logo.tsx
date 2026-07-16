/**
 * Símbolo da marca: uma linha de pulso que se dissolve em pixels.
 * Sem contêiner — a marca vive na tipografia, não em um ícone de aplicativo.
 */
export function LogoMark({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 20" className={className} aria-hidden="true" fill="none">
      <path
        d="M1 13h7l3.5-9 5 14 3.5-10 2.5 5h5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="31" y="10.5" width="5" height="5" fill="#5362FF" />
      <rect x="38" y="4.5" width="4" height="4" fill="#16C7CE" />
    </svg>
  );
}

/** Traço de pulso que substitui a barra entre PULSO e BYTE no masthead. */
function PulseTick({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 14 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M1 15h2.5L7 4l4 16 2-8"
        stroke="#5362FF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Marca tipográfica PULSO⌁BYTE.
 * `size`: "masthead" para o cabeçalho da capa, "compact" para barras e rodapé.
 */
export function Wordmark({
  size = "compact",
  className = "",
}: {
  size?: "masthead" | "compact";
  className?: string;
}) {
  const text =
    size === "masthead"
      ? "text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem]"
      : "text-[1.35rem]";
  const tick =
    size === "masthead"
      ? "h-[0.72em] w-auto mx-[0.06em] translate-y-[0.04em]"
      : "h-[0.72em] w-auto mx-[0.05em] translate-y-[0.04em]";

  return (
    <span
      className={`inline-flex items-baseline font-sans font-extrabold leading-none tracking-[-0.045em] ${text} ${className}`}
    >
      PULSO
      <PulseTick className={`inline-block self-center ${tick}`} />
      <span className="text-brand">BYTE</span>
    </span>
  );
}
