import type { ComponentPropsWithoutRef } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import {
  AdSlot,
  Callout,
  ComparisonTable,
  Figure,
  KeyTakeaways,
  ProsAndCons,
  Quote,
  Sources,
  StepByStep,
} from "@/components/mdx";
import {
  BestFor,
  ContextBox,
  CorrectionNote,
  Definition,
  FAQ,
  FinalVerdict,
  QuickSummary,
  QuickVerdict,
  Requirements,
  Timeline,
  Troubleshooting,
  UpdateHistory,
  WhatChanged,
  WhyItMatters,
} from "@/components/mdx/editorial";
import { GuideChecklist } from "@/components/interactive/GuideChecklist";

const components = {
  Callout,
  KeyTakeaways,
  ProsAndCons,
  ComparisonTable,
  Sources,
  SourceList: Sources,
  Figure,
  Quote,
  StepByStep,
  AdSlot,
  QuickSummary,
  Definition,
  ContextBox,
  WhyItMatters,
  WhatChanged,
  FAQ,
  Timeline,
  UpdateHistory,
  CorrectionNote,
  Requirements,
  Troubleshooting,
  QuickVerdict,
  BestFor,
  FinalVerdict,
  GuideChecklist,
  // Tabelas escritas em Markdown ganham rolagem horizontal em telas pequenas.
  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="table-wrap">
      <table {...props} />
    </div>
  ),
};

/** Renderiza o conteúdo MDX de um artigo com os componentes do portal. */
export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        // Os artigos são arquivos locais do repositório, compilados no build —
        // conteúdo confiável, não entrada de usuários. blockJS: false permite as
        // props JSX dos componentes (ex.: items={[...]}); blockDangerousJS segue
        // ativo (padrão da v6) e bloqueia eval, process, constructor etc.
        blockJS: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  );
}
