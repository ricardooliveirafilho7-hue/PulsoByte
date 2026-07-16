import type { Metadata } from "next";
import { site } from "@/config/site";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Política Editorial",
  description:
    "Como o PulsoByte produz, revisa e corrige conteúdo: critérios editoriais, independência e transparência.",
  alternates: { canonical: "/politica-editorial" },
};

export default function EditorialPolicyPage() {
  return (
    <StaticPage
      title="Política Editorial"
      intro="Os princípios que orientam tudo o que publicamos."
    >
      <h2>Clareza acima de tudo</h2>
      <p>
        Escrevemos para pessoas, não para algoritmos. Cada texto deve poder ser entendido por
        quem não é especialista, sem perder a precisão técnica.
      </p>
      <h2>Independência</h2>
      <p>
        Nossas análises e comparativos refletem exclusivamente a avaliação da redação. Conteúdo
        publicitário, quando existir, será sempre identificado de forma explícita.
      </p>
      <h2>Precisão e fontes</h2>
      <p>
        Citamos fontes verificáveis e indicamos quando uma informação é estimativa ou opinião.
        Guias e tutoriais são testados antes da publicação sempre que possível.
      </p>
      <h2>Correções</h2>
      <p>
        Erros acontecem — e são corrigidos com transparência. Artigos corrigidos exibem a data de
        atualização. Para apontar um erro, escreva para{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
      <h2>Uso de ferramentas</h2>
      <p>
        Podemos usar ferramentas digitais, inclusive de inteligência artificial, para apoiar
        pesquisa e produção. A responsabilidade editorial pelo conteúdo publicado é sempre da
        redação do {site.name}.
      </p>
    </StaticPage>
  );
}
