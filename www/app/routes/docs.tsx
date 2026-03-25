import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { baseOptions } from "~/lib/layout.shared";
import { getMDXComponents } from "~/components/mdx";
import type { Route } from "./+types/docs";

// Eager-load MDX modules (works on both server and client)
const mdxModules = import.meta.glob("../../content/docs/**/*.mdx", {
  eager: true,
  query: { collection: "docs" },
});

const mdxByPath: Record<string, React.ComponentType> = {};
for (const [key, mod] of Object.entries(mdxModules)) {
  const normalized = key.replace(/^.*?content\/docs\//, "");
  const m = mod as Record<string, unknown>;
  if (typeof m.default === "function") {
    mdxByPath[normalized] = m.default as React.ComponentType;
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  // Dynamic import keeps collections/server out of client bundle
  const { source } = await import("~/lib/source");

  const slug = params["*"] || "";
  const slugArray = slug ? slug.split("/").filter(Boolean) : [];
  const page = source.getPage(slugArray);
  if (!page) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    page: {
      title: page.data.title,
      description: page.data.description,
      toc: page.data.toc,
      full: page.data.full,
      url: page.url,
      slugs: page.slugs,
      path: page.path,
    },
    // Use Fumadocs' built-in serialization: renders React icons to HTML strings
    tree: await source.serializePageTree(source.pageTree),
  };
}

export default function Docs({ loaderData }: Route.ComponentProps) {
  // useFumadocsLoader deserializes the page tree (HTML strings → React elements)
  const { tree, page } = useFumadocsLoader(loaderData) as {
    tree: ReturnType<typeof import("fumadocs-core/source").loader>["pageTree"];
    page: typeof loaderData.page;
  };
  const MDXContent = mdxByPath[page.path];

  return (
    <DocsLayout tree={tree} {...baseOptions}>
      <DocsPage toc={page.toc} full={page.full}>
        <DocsTitle className="mb-0">{page.title}</DocsTitle>
        <DocsDescription className="mb-0">{page.description}</DocsDescription>
        <div className="flex flex-row flex-wrap gap-2 items-center border-b pb-6">
          <MarkdownCopyButton
            markdownUrl={`/docs-raw/${page.slugs.join("/")}`}
          />
          <ViewOptionsPopover
            markdownUrl={`/docs-raw/${page.slugs.join("/")}`}
            githubUrl={`https://github.com/rohanprasadofficial/localflare/blob/main/www/content/docs/${page.path}`}
          />
        </div>
        <DocsBody>
          {MDXContent ? <MDXContent components={getMDXComponents()} /> : null}
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}

export function meta({ data }: Route.MetaArgs) {
  const loaderData = data as Awaited<ReturnType<typeof loader>> | undefined;
  return [
    {
      title: loaderData?.page?.title
        ? `${loaderData.page.title} - Localflare Docs`
        : "Localflare Docs",
    },
  ];
}
