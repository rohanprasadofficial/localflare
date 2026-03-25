import type { Config } from "@react-router/dev/config";
import fs from "node:fs";
import path from "node:path";

function getDocSlugs(dir: string, base = ""): string[] {
  const slugs: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      slugs.push(...getDocSlugs(path.join(dir, entry.name), `${base}${entry.name}/`));
    } else if (entry.name.endsWith(".mdx")) {
      const name = entry.name.replace(/\.mdx$/, "");
      slugs.push(name === "index" ? base.replace(/\/$/, "") : `${base}${name}`);
    }
  }
  return slugs;
}

export default {
  ssr: true,
  buildDirectory: "dist",
  async prerender() {
    const contentDir = path.resolve(__dirname, "content/docs");
    const docSlugs = getDocSlugs(contentDir);
    return [
      "/",
      "/docs",
      ...docSlugs.filter(Boolean).map((slug) => `/docs/${slug}`),
    ];
  },
} satisfies Config;
