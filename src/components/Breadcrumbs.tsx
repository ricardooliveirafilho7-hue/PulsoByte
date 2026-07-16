import Link from "next/link";
import { absoluteUrl } from "@/config/site";
import { JsonLd } from "@/components/JsonLd";

export interface Crumb {
  label: string;
  href?: string;
}

/** Trilha de navegação visível + JSON-LD BreadcrumbList. */
export function Breadcrumbs({
  items,
  align = "left",
}: {
  items: Crumb[];
  align?: "left" | "center";
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };

  return (
    <nav
      aria-label="Trilha de navegação"
      className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
    >
      <JsonLd data={jsonLd} />
      <ol
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        {items.map((item, index) => (
          <li
            key={index}
            className={`max-w-full items-center gap-2 ${
              index > 0 && index < items.length - 1 ? "hidden sm:flex" : "flex"
            }`}
          >
            {index > 0 && (
              <span aria-hidden="true" className="text-line">/</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="transition-colors duration-200 hover:text-brand-dark"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
