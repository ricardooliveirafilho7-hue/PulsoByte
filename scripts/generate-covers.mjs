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
  { file: "o-que-sao-modelos-de-linguagem", from: "#3345DB", to: "#4F63FF", motif: "nodes" },
  { file: "como-organizar-notificacoes-do-celular", from: "#4F63FF", to: "#20C9D6", motif: "cards" },
  { file: "wi-fi-7-explicado", from: "#0B0D12", to: "#3345DB", motif: "waves" },
  { file: "por-que-tudo-virou-assinatura", from: "#3345DB", to: "#20C9D6", motif: "bars" },
  { file: "guia-backup-do-celular", from: "#4F63FF", to: "#3345DB", motif: "shield" },
  { file: "notebook-ou-tablet-qual-escolher", from: "#20C9D6", to: "#4F63FF", motif: "split" },
  { file: "exemplo-rascunho", from: "#626978", to: "#0B0D12", motif: "nodes" },
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
      <rect x="360" y="160" width="560" height="96" rx="20" opacity="0.95"/>
      <rect x="360" y="300" width="560" height="96" rx="20" opacity="0.7"/>
      <rect x="360" y="440" width="560" height="96" rx="20" opacity="0.4"/>
      <circle cx="424" cy="208" r="24" fill="#4F63FF"/>
      <circle cx="424" cy="348" r="24" fill="#20C9D6"/>
    </g>`,
  waves: `
    <g stroke="#ffffff" fill="none" stroke-linecap="round">
      <path d="M340 500 Q640 320 940 500" stroke-width="10" opacity="0.9"/>
      <path d="M420 430 Q640 300 860 430" stroke-width="8" opacity="0.6"/>
      <path d="M500 370 Q640 280 780 370" stroke-width="6" opacity="0.4"/>
      <circle cx="640" cy="540" r="20" fill="#20C9D6" stroke="none"/>
    </g>`,
  bars: `
    <g fill="#ffffff">
      <rect x="320" y="400" width="120" height="180" rx="16" opacity="0.5"/>
      <rect x="480" y="330" width="120" height="250" rx="16" opacity="0.7"/>
      <rect x="640" y="260" width="120" height="320" rx="16" opacity="0.85"/>
      <rect x="800" y="180" width="120" height="400" rx="16"/>
    </g>`,
  shield: `
    <g>
      <path d="M640 140 L840 220 V400 Q840 520 640 590 Q440 520 440 400 V220 Z"
        fill="#ffffff" opacity="0.95"/>
      <path d="M560 380 L620 440 L740 310" stroke="#3345DB" stroke-width="22"
        fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`,
  split: `
    <g fill="#ffffff">
      <rect x="280" y="200" width="400" height="260" rx="16" opacity="0.95"/>
      <rect x="300" y="470" width="360" height="24" rx="10" opacity="0.7"/>
      <rect x="760" y="180" width="240" height="330" rx="20" opacity="0.85"/>
      <rect x="850" y="520" width="60" height="10" rx="5" opacity="0.6"/>
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
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${1100 + (i % 4) * 40}" y="${40 + Math.floor(i / 4) * 40}" width="24" height="24" rx="5"/>`).join("")}
    </g>
    ${motifs[motif]}
    ${pulseLine()}
  </svg>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3345DB"/>
        <stop offset="1" stop-color="#4F63FF"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <g fill="#20C9D6" opacity="0.9">
      <rect x="1020" y="80" width="36" height="36" rx="8"/>
      <rect x="1070" y="130" width="24" height="24" rx="6" opacity="0.7"/>
    </g>
    <path d="M100 330 h150 l45 -100 65 160 45 -110 35 50 h660"
      stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
    <text x="100" y="300" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="bold" fill="#ffffff">Pulso<tspan fill="#B9E8FF">Byte</tspan></text>
    <text x="100" y="400" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#EEF0FF">Tecnologia sem ruído.</text>
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
