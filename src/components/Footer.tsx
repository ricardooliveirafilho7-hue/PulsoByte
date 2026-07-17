import Link from "next/link";
import { categories } from "@/config/categories";
import { site } from "@/config/site";
import { Wordmark, LogoMark } from "@/components/Logo";

const institutional = [
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/politica-editorial", label: "Política Editorial" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/politica-de-cookies", label: "Política de Cookies" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-panel text-panel-ink" data-focus-hide>
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-10 border-b border-white/15 pb-12 lg:flex-row">
          <div className="max-w-md">
            <Wordmark className="text-white" />
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              {site.slogan} O PulsoByte explica o que mudou, por que importa, como funciona e
              qual opção escolher — em inteligência artificial, aplicativos, tecnologia e
              negócios digitais.
            </p>
            <LogoMark className="mt-6 h-5 w-auto text-white/40" />
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <nav aria-label="Categorias no rodapé">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                Editorias
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/categoria/${category.slug}`}
                      className="text-white/80 transition-colors duration-200 hover:text-white"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Institucional">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                Institucional
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {institutional.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-white/80 transition-colors duration-200 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <p className="pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
