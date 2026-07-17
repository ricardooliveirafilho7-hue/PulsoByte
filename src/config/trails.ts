import type { Difficulty } from "@/config/editorial";

/**
 * Trilhas de leitura: sequências curadas de artigos reais já publicados.
 * Os slugs precisam existir em content/articles — a montagem em
 * src/lib/trails.ts ignora slugs não publicados, então uma trilha nunca
 * aponta para conteúdo inexistente.
 */

export interface TrailConfig {
  slug: string;
  title: string;
  objective: string;
  level: Difficulty;
  articleSlugs: string[];
}

export const trails: TrailConfig[] = [
  {
    slug: "entenda-inteligencia-artificial",
    title: "Entenda Inteligência Artificial",
    objective:
      "Do conceito ao impacto real: o que são modelos de linguagem, como usá-los no trabalho e o que eles mudam na internet e na infraestrutura.",
    level: "beginner",
    articleSlugs: [
      "o-que-sao-modelos-de-linguagem",
      "assistentes-de-ia-no-trabalho",
      "busca-com-ia-como-muda-a-internet",
      "data-centers-e-energia",
    ],
  },
  {
    slug: "proteja-sua-vida-digital",
    title: "Proteja sua vida digital",
    objective:
      "Passos práticos para viver sem senhas fracas, manter backup do celular em dia e recuperar o controle das notificações.",
    level: "beginner",
    articleSlugs: [
      "guia-passkeys-adeus-senhas",
      "guia-backup-do-celular",
      "como-organizar-notificacoes-do-celular",
    ],
  },
];
