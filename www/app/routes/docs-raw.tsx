import type { Route } from "./+types/docs-raw";
import { source } from "~/lib/source";

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params["*"] || "";
  const slugs = slug.split("/").filter(Boolean);
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
