export type CategoryIcon =
  | "brain"
  | "apps"
  | "chip"
  | "briefcase"
  | "book"
  | "scale"
  | "newspaper";

export interface Category {
  name: string;
  shortName: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  icon: CategoryIcon;
  order: number;
}

const allCategories: Category[] = [
  {
    name: "Inteligência Artificial",
    shortName: "IA",
    slug: "inteligencia-artificial",
    description:
      "Modelos, assistentes e ferramentas de IA explicados com clareza: o que mudou, por que importa e como usar no dia a dia.",
    seoTitle: "Inteligência Artificial: notícias, guias e análises",
    seoDescription:
      "Acompanhe inteligência artificial sem ruído: novidades, guias práticos e análises de modelos, assistentes e ferramentas de IA.",
    icon: "brain",
    order: 1,
  },
  {
    name: "Aplicativos",
    shortName: "Aplicativos",
    slug: "aplicativos",
    description:
      "Análises, dicas e truques dos aplicativos que você usa todos os dias, no celular e no computador.",
    seoTitle: "Aplicativos: análises, dicas e truques",
    seoDescription:
      "Descubra os melhores aplicativos e aprenda a aproveitar ao máximo os que você já usa, com análises e dicas objetivas.",
    icon: "apps",
    order: 2,
  },
  {
    name: "Tecnologia",
    shortName: "Tecnologia",
    slug: "tecnologia",
    description:
      "Dispositivos, plataformas e tendências que definem o presente e o futuro da tecnologia, sem exagero e sem jargão.",
    seoTitle: "Tecnologia: dispositivos, plataformas e tendências",
    seoDescription:
      "Entenda a tecnologia que importa: dispositivos, plataformas e tendências explicados de forma clara e direta.",
    icon: "chip",
    order: 3,
  },
  {
    name: "Negócios Digitais",
    shortName: "Negócios",
    slug: "negocios-digitais",
    description:
      "Startups, plataformas, mercado e as decisões de negócio por trás da tecnologia que chega até você.",
    seoTitle: "Negócios Digitais: mercado, startups e plataformas",
    seoDescription:
      "O lado de negócios da tecnologia: startups, plataformas, estratégia e mercado digital explicados sem ruído.",
    icon: "briefcase",
    order: 4,
  },
  {
    name: "Guias",
    shortName: "Guias",
    slug: "guias",
    description:
      "Tutoriais passo a passo para configurar, resolver e dominar tecnologia — do básico ao avançado.",
    seoTitle: "Guias e tutoriais de tecnologia passo a passo",
    seoDescription:
      "Guias práticos e tutoriais passo a passo para configurar aparelhos, resolver problemas e usar melhor a tecnologia.",
    icon: "book",
    order: 5,
  },
  {
    name: "Comparativos",
    shortName: "Comparativos",
    slug: "comparativos",
    description:
      "Comparações honestas entre produtos, serviços e planos para você escolher com segurança.",
    seoTitle: "Comparativos: qual escolher entre produtos e serviços",
    seoDescription:
      "Comparativos honestos de produtos, aplicativos e serviços de tecnologia para ajudar você a escolher a melhor opção.",
    icon: "scale",
    order: 6,
  },
  {
    name: "Notícias",
    shortName: "Notícias",
    slug: "noticias",
    description:
      "O que aconteceu na tecnologia e o que isso muda para você, resumido com contexto e sem alarde.",
    seoTitle: "Notícias de tecnologia com contexto",
    seoDescription:
      "As notícias de tecnologia que importam, com contexto e explicação do que muda para você — sem sensacionalismo.",
    icon: "newspaper",
    order: 7,
  },
];

/** Categorias na ordem de exibição configurada. */
export const categories: Category[] = [...allCategories].sort((a, b) => a.order - b.order);

export function getCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export const categorySlugs = categories.map((category) => category.slug);
