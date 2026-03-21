import type { Route } from "./+types/docs-raw";

export async function loader({ params }: Route.LoaderArgs) {
  const { source } = await import("~/lib/source");

  const slug = params["*"] || "";
  const slugs = slug.split("/").filter((v) => v.length > 0);
  const page = source.getPage(slugs);

  if (!page) {
    throw new Response("Not Found", { status: 404 });
  }

  const processed = await page.data.getText("processed");
  const content = `# ${page.data.title} (${page.url})\n\n${processed}`;

  return new Response(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
