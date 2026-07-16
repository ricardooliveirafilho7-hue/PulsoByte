import type { Metadata } from "next";
import { site } from "@/config/site";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe do PulsoByte: pautas, correções, parcerias e imprensa.",
  alternates: { canonical: "/contato" },
};

export default function ContactPage() {
  return (
    <StaticPage
      title="Contato"
      intro="Fale com a redação do PulsoByte. Respondemos o mais rápido possível."
    >
      <h2>E-mail</h2>
      <p>
        Para qualquer assunto, escreva para <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
      <h2>Assuntos frequentes</h2>
      <ul>
        <li>
          <strong>Sugestão de pauta</strong> — conte o que você gostaria de ver explicado sem
          ruído.
        </li>
        <li>
          <strong>Correções</strong> — encontrou um erro? Indique o artigo e o trecho, e
          corrigiremos com transparência.
        </li>
        <li>
          <strong>Parcerias e imprensa</strong> — descreva a proposta no próprio e-mail.
        </li>
      </ul>
      <p>
        Antes de escrever, vale conferir a nossa <a href="/politica-editorial">política editorial</a>{" "}
        para entender como produzimos e corrigimos conteúdo.
      </p>
    </StaticPage>
  );
}
