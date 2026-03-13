import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { analyticsProxy } from "./server/analytics-proxy"
import { r2Proxy } from "./server/r2-proxy"

export default defineConfig({
  plugins: [react(), tailwindcss(), analyticsProxy(), r2Proxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8788",
        changeOrigin: true,
      },
      "/cf-api": {
        target: "https://api.cloudflare.com/client/v4",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cf-api/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Host", "api.cloudflare.com");
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
            proxyReq.removeHeader("cookie");
          });
        },
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})
