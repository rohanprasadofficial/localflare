import { HugeiconsIcon } from "@hugeicons/react"
import {
  Database02Icon,
  HardDriveIcon,
  Folder01Icon,
  Layers01Icon,
  CommandIcon,
  LinkSquare01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface LandingPageProps {
  onRetry?: () => void
}

export function LandingPage({ onRetry }: LandingPageProps) {
  const port = new URLSearchParams(window.location.search).get('port') || '8788'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-lg">Localflare</span>
        </div>
        <a
          href="https://localflare.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" strokeWidth={2} />
          localflare.dev
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Animated Icons */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { icon: Database02Icon, color: "text-d1", delay: "0s" },
            { icon: HardDriveIcon, color: "text-kv", delay: "0.1s" },
            { icon: Folder01Icon, color: "text-r2", delay: "0.2s" },
            { icon: Layers01Icon, color: "text-do", delay: "0.3s" },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-card border border-border shadow-sm animate-bounce"
              style={{ animationDelay: item.delay, animationDuration: "2s" }}
            >
              <HugeiconsIcon
                icon={item.icon}
                className={cn("size-6", item.color)}
                strokeWidth={2}
              />
            </div>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-3">
          Waiting for Localflare Server
        </h1>
        <p className="text-muted-foreground text-center max-w-md mb-10">
          Start the Localflare API server to view and manage your Cloudflare Workers bindings locally.
        </p>

        {/* Instructions Card */}
        <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={CommandIcon} className="size-5 text-muted-foreground" strokeWidth={2} />
              <span className="font-medium">Quick Start</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Navigate to your Worker project</p>
                <code className="block p-3 rounded-lg bg-zinc-900 text-zinc-100 text-sm font-mono">
                  cd your-worker-project
                </code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Start the Localflare server</p>
                <code className="block p-3 rounded-lg bg-zinc-900 text-zinc-100 text-sm font-mono">
                  npx localflare --studio --port {port}
                </code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Make sure wrangler dev is running</p>
                <p className="text-xs text-muted-foreground">
                  Localflare reads from the <code className="px-1 py-0.5 bg-muted rounded">.wrangler/state</code> directory created by wrangler.
                </p>
              </div>
            </div>
          </div>

          {/* Retry Button */}
          <div className="p-5 border-t border-border bg-muted/20">
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              <HugeiconsIcon icon={RefreshIcon} className="size-4" strokeWidth={2} />
              Check Connection
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Connecting to <code className="px-1 py-0.5 bg-muted rounded">localhost:{port}</code>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
          {[
            { label: "D1 Databases", icon: Database02Icon, color: "text-d1" },
            { label: "KV Storage", icon: HardDriveIcon, color: "text-kv" },
            { label: "R2 Buckets", icon: Folder01Icon, color: "text-r2" },
            { label: "Durable Objects", icon: Layers01Icon, color: "text-do" },
          ].map((feature) => (
            <div key={feature.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={feature.icon} className={cn("size-4", feature.color)} strokeWidth={2} />
              {feature.label}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 flex items-center justify-center gap-6">
        <a
          href="https://github.com/rohanprasadofficial/localflare"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
        <a
          href="https://x.com/rohanpdofficial"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Follow
        </a>
      </footer>
    </div>
  )
}
