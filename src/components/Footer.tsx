import Link from "next/link";
import { categories } from "@/config/categories";
import { site } from "@/config/site";
import { Logo } from "@/components/Logo";

const institutional = [
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/politica-editorial", label: "Política Editorial" },
];

const legal = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/politica-de-cookies", label: "Política de Cookies" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {site.slogan} O PulsoByte explica o que mudou, por que importa, como funciona e qual
            opção escolher — em inteligência artificial, aplicativos, tecnologia e negócios
            digitais.
          </p>
        </div>

        <nav aria-label="Categorias no rodapé">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Categorias
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="text-ink hover:text-brand-dark hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Institucional
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[...institutional, ...legal].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink hover:text-brand-dark hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
