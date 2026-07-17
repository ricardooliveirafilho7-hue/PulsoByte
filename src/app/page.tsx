import Link from "next/link";
import { categories } from "@/config/categories";
import { site, absoluteUrl } from "@/config/site";
import { contentTypeLabels, difficultyLabels } from "@/config/editorial";
import { getArticles, type Article } from "@/lib/articles";
import { getTrails } from "@/lib/trails";
import {
  ComparisonStory,
  HorizontalStory,
  ImageStory,
  LeadStory,
  StoryListItem,
  TextStory,
} from "@/components/stories";
import { EmptyState } from "@/components/EmptyState";
import { JsonLd } from "@/components/JsonLd";
import { ArticleImage } from "@/components/ArticleImage";

export const metadata = {
  title: { absolute: `${site.name} — Tecnologia sem ruído` },
  alternates: { canonical: "/" },
};

/** Cabeçalho de seção: regra escura de jornal + título em versalete. */
function SectionHeader({
  title,
  href,
  accent = false,
}: {
  title: string;
  href?: string;
  accent?: boolean;
}) {
  return (
    <div className={`mb-8 flex items-baseline justify-between gap-4 border-t-2 pt-3 ${accent ? "border-brand" : "border-ink"}`}>
      <h2 className="text-sm font-bold uppercase tracking-[0.18em]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-muted transition-colors duration-200 hover:text-brand-dark"
        >
          Ver editoria →
        </Link>
      )}
    </div>
  );
}

/** Faixa “Radar”: manchetes recentes em linha única, rolável no celular. */
function Radar({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <div className="border-b border-line bg-surface" data-focus-hide>
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
          <span className="h-1.5 w-1.5 bg-brand" aria-hidden="true" />
          Radar
        </span>
        {articles.map((article, index) => (
          <span key={article.slug} className="flex shrink-0 items-center gap-4 text-xs">
            {index > 0 && <span className="text-line" aria-hidden="true">/</span>}
            <Link
              href={`/artigos/${article.slug}`}
              className="whitespace-nowrap font-medium text-muted transition-colors duration-200 hover:text-ink"
            >
              {article.title}
            </Link>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const articles = getArticles();
  const lead = articles.find((article) => article.featured) ?? articles[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organizacao"),
        name: site.name,
        url: site.url,
        slogan: site.slogan,
        logo: absoluteUrl("/icon.svg"),
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#site"),
        name: site.name,
        url: site.url,
        description: site.description,
        inLanguage: site.locale,
        publisher: { "@id": absoluteUrl("/#organizacao") },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/buscar")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  if (!lead) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <JsonLd data={jsonLd} />
        <EmptyState
          title="Ainda não há artigos publicados"
          message="Adicione arquivos MDX em content/articles para começar a publicar."
          actionHref="/"
          actionLabel="Voltar ao início"
        />
      </div>
    );
  }

  // Distribui os artigos entre as seções sem repetição: cada matéria aparece
  // em uma única seção editorial. Seções sem pelo menos `min` matérias não
  // são renderizadas e devolvem seu conteúdo ao fluxo geral.
  const rest = articles.filter((article) => article.slug !== lead.slug);
  const latest = rest.slice(0, 6);
  const used = new Set<string>();
  const claim = (predicate: (a: Article) => boolean, min: number, max: number): Article[] => {
    const picked = rest.filter((a) => !used.has(a.slug) && predicate(a)).slice(0, max);
    if (picked.length < min) return [];
    picked.forEach((a) => used.add(a.slug));
    return picked;
  };

  const ia = claim((a) => a.category === "inteligencia-artificial", 2, 4);
  const guias = claim((a) => a.category === "guias", 2, 4);
  const comparativos = claim((a) => a.category === "comparativos", 2, 2);
  const negocios = claim((a) => a.category === "negocios-digitais", 2, 3);

  // “Vale entender”: curadoria duradoura. Prefere artigos evergreen ainda não
  // usados em outras seções, mas pode repetir um essencial — é o ponto da
  // seção: esse conteúdo não deve desaparecer da capa.
  const valePool = rest.filter(
    (a) => a.evergreen && ["explainer", "guide", "comparison"].includes(a.contentType)
  );
  const vale = [
    ...valePool.filter((a) => !used.has(a.slug)),
    ...valePool.filter((a) => used.has(a.slug)),
  ].slice(0, 4);
  vale.forEach((a) => used.add(a.slug));

  const flow = rest.filter((a) => !used.has(a.slug)).slice(0, 5);
  const trilhas = getTrails();

  return (
    <>
      <Radar articles={latest.slice(0, 4)} />
      <JsonLd data={jsonLd} />

      <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        {/* Capa: manchete à esquerda, fluxo “Últimas” à direita */}
        <section aria-label="Destaques" className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <LeadStory article={lead} />
          </div>
          <aside className="lg:col-span-4" aria-label="Últimas notícias">
            <div className="border-t-2 border-ink pt-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em]">
                Últimas <span aria-hidden="true" className="text-brand">───</span>
              </h2>
            </div>
            <ol className="mt-1">
              {latest.map((article) => (
                <StoryListItem key={article.slug} article={article} />
              ))}
            </ol>
            <Link
              href="/artigos"
              className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-muted transition-colors duration-200 hover:text-brand-dark"
            >
              Todos os artigos →
            </Link>
          </aside>
        </section>

        {/* Inteligência Artificial: uma matéria grande + manchetes de texto */}
        {ia.length > 0 && (
          <section aria-labelledby="secao-ia" className="mt-16 lg:mt-20">
            <SectionHeader title="Inteligência Artificial" href="/categoria/inteligencia-artificial" />
            <h2 id="secao-ia" className="sr-only">Inteligência Artificial</h2>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <ImageStory article={ia[0]!} ratio="16/9" />
              </div>
              <div className="flex flex-col gap-8 border-line lg:col-span-5 lg:border-l lg:pl-12">
                {ia.slice(1).map((article) => (
                  <div key={article.slug} className="border-b border-line pb-8 last:border-b-0 last:pb-0">
                    <TextStory article={article} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* “Agora”: fluxo cronológico simples, sem cards */}
        {flow.length > 0 && (
          <section aria-labelledby="secao-fluxo" className="mt-16 lg:mt-20">
            <SectionHeader title="Agora" href="/artigos" />
            <h2 id="secao-fluxo" className="sr-only">Publicações recentes</h2>
            <div className="border-t border-line">
              {flow.map((article) => (
                <HorizontalStory key={article.slug} article={article} />
              ))}
            </div>
            <Link
              href="/artigos"
              className="mt-6 inline-flex h-11 items-center border border-ink px-6 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-brand hover:text-brand-dark"
            >
              Carregar mais publicações
            </Link>
          </section>
        )}

        {/* “Vale entender”: curadoria de conteúdo duradouro */}
        {vale.length >= 3 && (
          <section aria-labelledby="secao-vale" className="mt-16 lg:mt-20">
            <SectionHeader title="Vale entender" accent />
            <h2 id="secao-vale" className="sr-only">Vale entender</h2>
            <p className="-mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-muted">
              Explicadores, guias e comparativos que continuam úteis muito depois da publicação.
            </p>
            <ol className="grid gap-x-12 sm:grid-cols-2">
              {vale.map((article, index) => (
                <li
                  key={article.slug}
                  className="group relative grid grid-cols-[40px_1fr] gap-4 border-b border-line py-6 sm:grid-cols-[48px_1fr]"
                >
                  <span
                    aria-hidden="true"
                    className="font-serif text-3xl font-bold leading-none text-line transition-colors duration-200 group-hover:text-brand sm:text-4xl"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                      {contentTypeLabels[article.contentType]}
                      <span className="text-muted"> · {article.readingTimeMinutes} min</span>
                    </p>
                    <h3 className="mt-2 font-serif text-lg font-bold leading-snug sm:text-xl">
                      <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
                        <span className="transition-colors duration-200 group-hover:text-brand-dark">
                          {article.title}
                        </span>
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {article.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Trilhas: sequências curadas para aprender um tema do zero */}
        {trilhas.length > 0 && (
          <section aria-labelledby="secao-trilhas" className="mt-16 lg:mt-20">
            <SectionHeader title="Trilhas de leitura" />
            <h2 id="secao-trilhas" className="sr-only">Trilhas de leitura</h2>
            <div className="grid gap-12 lg:grid-cols-2">
              {trilhas.map((trail) => (
                <article key={trail.slug} className="border-l-2 border-brand pl-6 sm:pl-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                    Trilha · {trail.articles.length} artigos ·{" "}
                    {difficultyLabels[trail.level]} · ~{trail.totalMinutes} min no total
                  </p>
                  <h3 className="mt-3 font-serif text-2xl font-bold leading-snug tracking-[-0.01em] sm:text-3xl">
                    {trail.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                    {trail.objective}
                  </p>
                  <ol className="mt-5 space-y-2.5">
                    {trail.articles.map((article, index) => (
                      <li key={article.slug} className="flex gap-3 text-sm leading-snug">
                        <span
                          aria-hidden="true"
                          className="w-5 shrink-0 font-serif font-bold text-muted"
                        >
                          {index + 1}.
                        </span>
                        <Link
                          href={`/artigos/${article.slug}`}
                          className="font-semibold transition-colors duration-200 hover:text-brand-dark"
                        >
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Guias: lista numerada de conteúdo prático */}
        {guias.length > 0 && (
          <section aria-labelledby="secao-guias" className="mt-16 lg:mt-20">
            <SectionHeader title="Guias práticos" href="/categoria/guias" accent />
            <h2 id="secao-guias" className="sr-only">Guias práticos</h2>
            <ol className="grid gap-x-12 sm:grid-cols-2">
              {guias.map((article, index) => (
                <li
                  key={article.slug}
                  className="group relative grid grid-cols-[48px_88px_1fr] gap-4 border-b border-line py-7 sm:grid-cols-[64px_112px_1fr] sm:gap-6"
                >
                  <span
                    aria-hidden="true"
                    className="font-serif text-4xl font-bold leading-none text-line transition-colors duration-200 group-hover:text-brand sm:text-5xl"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ArticleImage article={article} variant="thumbnail" sizes="112px" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
                      Guia · {article.readingTimeMinutes} min
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-bold leading-snug sm:text-2xl">
                      <Link href={`/artigos/${article.slug}`} className="after:absolute after:inset-0">
                        <span className="transition-colors duration-200 group-hover:text-brand-dark">
                          {article.title}
                        </span>
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {article.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Comparativos: composição dividida ao meio */}
        {comparativos.length === 2 && (
          <section aria-labelledby="secao-comparativos" className="mt-16 lg:mt-20">
            <SectionHeader title="Comparativos" href="/categoria/comparativos" />
            <h2 id="secao-comparativos" className="sr-only">Comparativos</h2>
            <div className="relative grid gap-12 sm:grid-cols-2 sm:gap-0">
              <div className="sm:pr-12">
                <ComparisonStory article={comparativos[0]!} index={0} />
              </div>
              <div className="border-line sm:border-l sm:pl-12">
                <ComparisonStory article={comparativos[1]!} index={1} />
              </div>
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 bg-background px-2 py-1 font-serif text-2xl font-bold italic text-brand sm:block"
              >
                ou
              </span>
            </div>
          </section>
        )}
      </div>

      {/* Negócios Digitais: módulo analítico em fundo escuro */}
      {negocios.length > 0 && (
        <section aria-labelledby="secao-negocios" className="mt-16 bg-panel py-14 text-panel-ink lg:mt-20">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-baseline justify-between gap-4 border-t-2 border-panel-accent pt-3">
              <h2 id="secao-negocios" className="text-sm font-bold uppercase tracking-[0.18em]">
                Negócios Digitais <span className="text-white/40">— o relatório</span>
              </h2>
              <Link
                href="/categoria/negocios-digitais"
                className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors duration-200 hover:text-white"
              >
                Ver editoria →
              </Link>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:gap-16">
              {negocios.map((article, index) => (
                <TextStory
                  key={article.slug}
                  article={article}
                  tone="dark"
                  featuredImage={index === 0}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorias: faixa tipográfica, sem caixas */}
      <nav
        aria-label="Todas as editorias"
        className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8"
      >
        <div className="rule-double pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Explore as editorias
          </p>
          <ul className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-4">
            {categories.map((category, index) => (
              <li key={category.slug} className="flex items-baseline gap-x-3">
                {index > 0 && (
                  <span aria-hidden="true" className="font-serif text-2xl text-line">/</span>
                )}
                <Link
                  href={`/categoria/${category.slug}`}
                  className="font-serif text-2xl font-bold tracking-[-0.01em] transition-colors duration-200 hover:text-brand-dark sm:text-3xl"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
