import type { Metadata } from "next";
import { site } from "@/config/site";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Sobre o PulsoByte",
  description:
    "Conheça o PulsoByte, portal editorial de tecnologia com um compromisso simples: explicar tecnologia sem ruído.",
  alternates: { canonical: "/sobre" },
};

export default function AboutPage() {
  return (
    <StaticPage
      title="Sobre o PulsoByte"
      intro="Tecnologia sem ruído. Esse é o nosso compromisso — e também o nosso método."
    >
      <p>
        O <strong>PulsoByte</strong> é um portal editorial dedicado a explicar tecnologia de forma
        clara, útil e honesta. Cobrimos inteligência artificial, aplicativos, dispositivos,
        negócios digitais e tudo o que muda a forma como vivemos e trabalhamos.
      </p>
      <h2>O que fazemos</h2>
      <p>Cada artigo que publicamos responde a pelo menos uma destas perguntas:</p>
      <ul>
        <li>O que mudou?</li>
        <li>Por que isso importa?</li>
        <li>Como funciona?</li>
        <li>Como utilizar?</li>
        <li>Qual opção escolher?</li>
      </ul>
      <h2>Como trabalhamos</h2>
      <p>
        Evitamos sensacionalismo, jargão desnecessário e listas infladas. Preferimos textos
        curtos e diretos, com contexto suficiente para você decidir com segurança. Nossos
        comparativos são honestos, nossos guias são testados e nossas notícias trazem o que muda
        para você — não apenas o que aconteceu.
      </p>
      <h2>Fale com a gente</h2>
      <p>
        Dúvidas, sugestões de pauta ou correções? Escreva para{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> ou visite a página de{" "}
        <a href="/contato">contato</a>.
      </p>
    </StaticPage>
  );
}
