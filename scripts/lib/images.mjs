import fs from "node:fs";
import crypto from "node:crypto";

/**
 * Utilidades de imagem compartilhadas pelo validador de imagens e pelo
 * gerador do catálogo editorial. O hash perceptual precisa ser idêntico nos
 * dois lugares — por isso vive aqui, em um único módulo.
 */

export function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/**
 * Hash perceptual 8x8 (aHash) em string binária de 64 bits, calculado com
 * sharp: redimensiona para 8x8, converte para tons de cinza e compara cada
 * pixel com a média. Determinístico para o mesmo arquivo.
 */
export async function perceptualHash(filePath, sharp) {
  const { data } = await sharp(filePath)
    .rotate()
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const average = data.reduce((sum, value) => sum + value, 0) / data.length;
  return [...data].map((value) => (value >= average ? "1" : "0")).join("");
}

/** Distância de Hamming entre dois hashes binários de mesmo comprimento. */
export function hammingDistance(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    throw new Error("hashes perceptuais incomparáveis (comprimentos diferentes).");
  }
  let distance = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) distance++;
  return distance;
}
