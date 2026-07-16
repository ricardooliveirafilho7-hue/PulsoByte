/**
 * Gera as capas WebP dos artigos de demonstração e a imagem social padrão.
 * Uso: npm run covers
 *
 * As capas são ilustrações vetoriais com a identidade da marca, convertidas
 * para WebP com sharp. Substitua pelos arquivos reais quando disponíveis.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "images", "articles");

const covers = [
  { file: "o-que-sao-modelos-de-linguagem", from: "#3945E0", to: "#5362FF", motif: "nodes" },
  { file: "como-organizar-notificacoes-do-celular", from: "#5362FF", to: "#16C7CE", motif: "cards" },
  { file: "wi-fi-7-explicado", from: "#232B9E", to: "#5362FF", motif: "waves" },
  { file: "por-que-tudo-virou-assinatura", from: "#3945E0", to: "#16C7CE", motif: "bars" },
  { file: "guia-backup-do-celular", from: "#5362FF", to: "#3945E0", motif: "shield" },
  { file: "notebook-ou-tablet-qual-escolher", from: "#16C7CE", to: "#5362FF", motif: "split" },
  { file: "exemplo-rascunho", from: "#60636B", to: "#09090B", motif: "nodes" },
  { file: "loja-de-aplicativos-novas-regras", from: "#5362FF", to: "#3945E0", motif: "cards" },
  { file: "assistentes-de-ia-no-trabalho", from: "#232B9E", to: "#5362FF", motif: "cards" },
  { file: "busca-com-ia-como-muda-a-internet", from: "#3945E0", to: "#16C7CE", motif: "nodes" },
  { file: "guia-passkeys-adeus-senhas", from: "#232B9E", to: "#3945E0", motif: "shield" },
  { file: "iphone-ou-android-em-2026", from: "#3945E0", to: "#5362FF", motif: "split" },
  { file: "economia-dos-criadores-plataformas", from: "#16C7CE", to: "#3945E0", motif: "bars" },
  { file: "data-centers-e-energia", from: "#232B9E", to: "#16C7CE", motif: "waves" },
];

const motifs = {
  nodes: `
    <g stroke="#ffffff" stroke-opacity="0.5" stroke-width="3" fill="none">
      <path d="M240 480 L480 300 L760 420 L1040 240"/>
      <path d="M480 300 L720 160 L1040 240"/>
    </g>
    <g fill="#ffffff">
      <circle cx="240" cy="480" r="16" opacity="0.9"/>
      <circle cx="480" cy="300" r="22"/>
      <circle cx="760" cy="420" r="14" opacity="0.8"/>
      <circle cx="720" cy="160" r="12" opacity="0.7"/>
      <circle cx="1040" cy="240" r="18" opacity="0.9"/>
    </g>`,
  cards: `
    <g fill="#ffffff">
      <rect x="360" y="160" width="560" height="96" rx="4" opacity="0.95"/>
      <rect x="360" y="300" width="560" height="96" rx="4" opacity="0.7"/>
      <rect x="360" y="440" width="560" height="96" rx="4" opacity="0.4"/>
      <circle cx="424" cy="208" r="24" fill="#5362FF"/>
      <circle cx="424" cy="348" r="24" fill="#16C7CE"/>
    </g>`,
  waves: `
    <g stroke="#ffffff" fill="none" stroke-linecap="round">
      <path d="M340 500 Q640 320 940 500" stroke-width="10" opacity="0.9"/>
      <path d="M420 430 Q640 300 860 430" stroke-width="8" opacity="0.6"/>
      <path d="M500 370 Q640 280 780 370" stroke-width="6" opacity="0.4"/>
      <circle cx="640" cy="540" r="20" fill="#16C7CE" stroke="none"/>
    </g>`,
  bars: `
    <g fill="#ffffff">
      <rect x="320" y="400" width="120" height="180" rx="3" opacity="0.5"/>
      <rect x="480" y="330" width="120" height="250" rx="3" opacity="0.7"/>
      <rect x="640" y="260" width="120" height="320" rx="3" opacity="0.85"/>
      <rect x="800" y="180" width="120" height="400" rx="3"/>
    </g>`,
  shield: `
    <g>
      <path d="M640 140 L840 220 V400 Q840 520 640 590 Q440 520 440 400 V220 Z"
        fill="#ffffff" opacity="0.95"/>
      <path d="M560 380 L620 440 L740 310" stroke="#3945E0" stroke-width="22"
        fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,
  split: `
    <g fill="#ffffff">
      <rect x="280" y="200" width="400" height="260" rx="3" opacity="0.95"/>
      <rect x="300" y="470" width="360" height="24" rx="2" opacity="0.7"/>
      <rect x="760" y="180" width="240" height="330" rx="4" opacity="0.85"/>
      <rect x="850" y="520" width="60" height="10" rx="2" opacity="0.6"/>
    </g>`,
};

function pulseLine(color = "#ffffff", opacity = 0.9) {
  return `<path d="M80 640 h180 l50 -110 70 170 50 -120 40 60 h730"
    stroke="${color}" stroke-opacity="${opacity}" stroke-width="6" fill="none"
    stroke-linecap="round" stroke-linejoin="round"/>`;
}

function coverSvg({ from, to, motif }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <g fill="#ffffff" opacity="0.08">
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${1100 + (i % 4) * 40}" y="${40 + Math.floor(i / 4) * 40}" width="24" height="24" rx="2"/>`).join("")}
    </g>
    ${motifs[motif]}
    ${pulseLine()}
  </svg>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#09090B"/>
    <g fill="#16C7CE">
      <rect x="1040" y="76" width="30" height="30"/>
      <rect x="1084" y="120" width="20" height="20" opacity="0.7"/>
    </g>
    <rect x="1084" y="76" width="30" height="30" fill="#5362FF"/>
    <path d="M100 470 h180 l50 -110 70 170 50 -120 40 60 h610"
      stroke="#5362FF" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
    <text x="96" y="300" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="bold" letter-spacing="-4" fill="#ffffff">PULSO<tspan fill="#5362FF">BYTE</tspan></text>
    <text x="100" y="368" font-family="Arial, Helvetica, sans-serif" font-size="34" letter-spacing="6" fill="#9B9DA6">TECNOLOGIA SEM RUÍDO</text>
  </svg>`;
}

await mkdir(OUT_DIR, { recursive: true });

for (const cover of covers) {
  const out = path.join(OUT_DIR, `${cover.file}.webp`);
  await sharp(Buffer.from(coverSvg(cover))).webp({ quality: 84 }).toFile(out);
  console.log(`✔ ${path.relative(process.cwd(), out)}`);
}

const ogOut = path.join(process.cwd(), "public", "images", "og-default.png");
await sharp(Buffer.from(ogSvg())).png().toFile(ogOut);
console.log(`✔ ${path.relative(process.cwd(), ogOut)}`);
