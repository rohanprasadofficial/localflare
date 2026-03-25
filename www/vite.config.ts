import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import fumadocs from "fumadocs-mdx/vite";
import * as sourceConfig from "./source.config";

export default defineConfig({
  plugins: [
    tailwindcss(),
    fumadocs(sourceConfig),
    reactRouter(),
    tsconfigPaths(),
  ],
});
