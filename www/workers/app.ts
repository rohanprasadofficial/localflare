import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
  // @ts-expect-error - built server bundle loaded at deploy time
  () => import("../dist/server/index.js"),
  "production"
);

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return Response.json({ status: "ok", service: "localflare-www" });
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler;
