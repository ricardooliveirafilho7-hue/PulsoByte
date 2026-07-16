import type { Metadata } from "next";
import { site } from "@/config/site";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Condições de uso do conteúdo e dos serviços do portal PulsoByte.",
  alternates: { canonical: "/termos-de-uso" },
};

export default function TermsPage() {
  return (
    <StaticPage title="Termos de Uso" intro="Condições para uso do conteúdo publicado no PulsoByte.">
      <h2>Uso do conteúdo</h2>
      <p>
        Todo o conteúdo do {site.name} — textos, imagens, marcas e layout — é protegido por
        direitos autorais. É permitido citar trechos com atribuição e link para o artigo
        original. A reprodução integral sem autorização prévia não é permitida.
      </p>
      <h2>Natureza informativa</h2>
      <p>
        Nossos artigos têm caráter informativo e educacional. Preços, disponibilidade e recursos
        de produtos podem mudar após a publicação. Decisões de compra ou de negócio são de
        responsabilidade do leitor.
      </p>
      <h2>Links externos</h2>
      <p>
        Artigos podem conter links para sites de terceiros. Não nos responsabilizamos pelo
        conteúdo ou pelas práticas de privacidade desses sites.
      </p>
      <h2>Alterações nos termos</h2>
      <p>
        Estes termos podem ser revisados periodicamente. A versão vigente estará sempre publicada
        nesta página.
      </p>
      <h2>Contato</h2>
      <p>
        Dúvidas sobre estes termos? Escreva para <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </StaticPage>
  );
}
