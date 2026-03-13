// Server-side R2 S3 proxy for Vite dev mode
// Signs and proxies S3 requests to R2 server-side, bypassing browser CORS restrictions

import type { Plugin } from "vite"
import type { IncomingMessage, ServerResponse } from "http"
import { AwsClient } from "aws4fetch"

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk: Buffer) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

export function r2Proxy(): Plugin {
  return {
    name: "r2-proxy",
    configureServer(server) {
      server.middlewares.use("/r2-s3-proxy", async (req: IncomingMessage, res: ServerResponse) => {
        const targetUrl = req.headers["x-r2-target-url"] as string
        const accessKeyId = req.headers["x-r2-access-key-id"] as string
        const secretAccessKey = req.headers["x-r2-secret-access-key"] as string
        const sessionToken = req.headers["x-r2-session-token"] as string

        if (!targetUrl || !accessKeyId || !secretAccessKey) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: "Missing required headers" }))
          return
        }

        try {
          const s3 = new AwsClient({
            accessKeyId,
            secretAccessKey,
            sessionToken,
            service: "s3",
            region: "auto",
          })

          const contentType = req.headers["content-type"]
          const body = req.method !== "GET" && req.method !== "HEAD"
            ? await readBody(req)
            : undefined

          const init: RequestInit = {
            method: req.method || "GET",
            body,
          }
          if (contentType) {
            init.headers = { "Content-Type": contentType }
          }

          const response = await s3.fetch(targetUrl, init)

          res.statusCode = response.status
          for (const [key, value] of response.headers) {
            const lower = key.toLowerCase()
            if (lower !== "transfer-encoding" && lower !== "content-encoding") {
              res.setHeader(key, value)
            }
          }

          const buffer = Buffer.from(await response.arrayBuffer())
          res.end(buffer)
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: "R2 proxy error", message: String(e) }))
        }
      })
    },
  }
}
