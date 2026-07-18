# Seleção de Tema e Identidade Semântica

## Comparação estruturada
Pontue/classifique cada candidato por: atualidade, relevância geral, interesse
para brasileiros, facilidade de entendimento, impacto prático, novidade,
curiosidade legítima, potencial de bom título, qualidade das fontes, existência
de fontes primárias, disponibilidade de imagens, diferença vs. artigos recentes,
potencial de busca, potencial de compartilhamento, vida útil do conteúdo.

## Eliminação automática
Descarte assuntos: já publicados; muito parecidos com artigos recentes;
sustentados por rumor; sem fontes suficientes; técnicos demais para público geral;
sem consequência prática; antigos sem atualização; com imagens inadequadas;
especulativos; que só parecem interessantes com título enganoso.

## Escolha
Apenas **um** tema. Ele precisa ter: entidade principal clara, acontecimento
específico, justificativa editorial, fontes suficientes, imagens apropriadas,
diferença objetiva em relação ao que já existe, e valor para o público brasileiro.

## Duplicidade é SEMÂNTICA
Dois artigos são equivalentes quando tratam da **mesma entidade + mesmo anúncio/
evento principal**, mesmo com palavras diferentes. Compare contra o inventário:
identificador, data, turno, slug, título normalizado, entidade, evento, topicKey
e termos relacionados. Rode `scripts/detect-duplicate-content.mjs`.

## topicKey
Combine (conforme o schema real): entidade + produto/serviço + evento +
versão/recurso + data relevante quando necessária.
Exemplo conceitual: `openai-chatgpt-novo-recurso-julho-2026`.
O formato aceito é slug ASCII em minúsculas, com termos separados por hífen,
conforme `validate-article-content-v2.mjs`.

Além do topicKey, registre internamente: entidade principal, evento principal,
palavras relacionadas, títulos alternativos, possíveis slugs, assunto normalizado.
