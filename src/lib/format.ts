import { site } from "@/config/site";

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(site.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Data curta para listas densas: “14 jul”. */
export function formatDateShort(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`)
    .toLocaleDateString(site.locale, { day: "2-digit", month: "short", timeZone: "UTC" })
    .replace(" de ", " ")
    .replace(".", "");
}
