import type { Metadata } from "next";
import { site } from "@/config/site";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Saiba quais dados o PulsoByte coleta, como são usados e quais são os seus direitos segundo a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PrivacyPolicyPage() {
  return (
    <StaticPage
      title="Política de Privacidade"
      intro="Como tratamos os seus dados ao visitar o PulsoByte."
    >
      <h2>Dados que coletamos</h2>
      <p>
        O {site.name} é um portal de conteúdo e não exige cadastro. Ao navegar, podem ser
        coletados dados técnicos básicos (como páginas visitadas, tipo de navegador e dados
        agregados de audiência) por serviços de medição e, quando ativa, pela veiculação de
        publicidade.
      </p>
      <h2>Publicidade</h2>
      <p>
        Podemos exibir anúncios fornecidos por terceiros, como o Google AdSense. Esses serviços
        podem usar cookies para personalizar anúncios. Você pode gerenciar as preferências de
        anúncios nas configurações da sua conta Google e do seu navegador.
      </p>
      <h2>Cookies</h2>
      <p>
        O uso de cookies neste portal está descrito em detalhes na nossa{" "}
        <a href="/politica-de-cookies">Política de Cookies</a>.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Nos termos da Lei Geral de Proteção de Dados (LGPD), você pode solicitar informações
        sobre o tratamento de seus dados, bem como correção ou exclusão, escrevendo para{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
      <h2>Alterações</h2>
      <p>
        Esta política pode ser atualizada para refletir mudanças legais ou operacionais. A versão
        vigente estará sempre publicada nesta página.
      </p>
    </StaticPage>
  );
}
