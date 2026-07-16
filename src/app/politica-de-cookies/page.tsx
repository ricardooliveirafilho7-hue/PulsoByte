import type { Metadata } from "next";
import { site } from "@/config/site";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Entenda quais cookies o PulsoByte utiliza, para que servem e como gerenciá-los.",
  alternates: { canonical: "/politica-de-cookies" },
};

export default function CookiePolicyPage() {
  return (
    <StaticPage title="Política de Cookies" intro="O que são cookies e como este portal os utiliza.">
      <h2>O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos armazenados no seu navegador que permitem reconhecer sua
        visita e lembrar preferências.
      </p>
      <h2>Cookies que podemos utilizar</h2>
      <ul>
        <li>
          <strong>Essenciais</strong> — necessários para o funcionamento básico das páginas.
        </li>
        <li>
          <strong>Medição de audiência</strong> — dados agregados e anônimos sobre uso do portal.
        </li>
        <li>
          <strong>Publicidade</strong> — quando anúncios estiverem ativos, parceiros como o
          Google AdSense podem usar cookies para exibir anúncios relevantes.
        </li>
      </ul>
      <h2>Como gerenciar</h2>
      <p>
        Você pode bloquear ou excluir cookies nas configurações do seu navegador. O portal
        continuará funcionando, embora algumas preferências possam não ser lembradas.
      </p>
      <h2>Dúvidas</h2>
      <p>
        Fale com a gente pelo e-mail <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </StaticPage>
  );
}
