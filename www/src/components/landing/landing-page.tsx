import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Database02Icon,
  FolderOpenIcon,
  LayersLogoIcon,
  QueueIcon,
  CloudIcon,
  Copy01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';

const Testimonials = lazy(() =>
  import('./testimonials').then((m) => ({ default: m.Testimonials }))
);

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fffaf5] text-zinc-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fffaf5]/90 backdrop-blur-sm border-b border-zinc-200/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-orange-600">
              <span className="text-[10px] font-bold text-white">LF</span>
            </div>
            <span className="text-sm font-medium">Localflare</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/docs" className="text-xs text-zinc-600 transition-colors hover:text-zinc-900">
              Docs
            </Link>
            <a
              href="https://github.com/rohanprasadofficial/localflare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 transition-colors hover:text-zinc-900"
            >
              GitHub
            </a>
            <a
              href="https://x.com/rohanpdofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 transition-colors hover:text-zinc-900"
            >
              @rohanpdofficial
            </a>
            <a
              href="https://www.npmjs.com/package/localflare"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-700"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-16">
        <div className="mx-auto max-w-6xl px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-600">
                <span className="size-1.5 rounded-full bg-orange-500" />
                Open Source
              </div>
              <a
                href="https://github.com/sponsors/rohanprasadofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-pink-300 bg-white px-3 py-1 text-xs font-medium text-pink-600 transition-all hover:bg-pink-50 hover:border-pink-400"
              >
                <span className="text-pink-500">♥</span>
                Sponsor
              </a>
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-800 sm:text-5xl">
              The missing dashboard for
              <br />
              <span className="text-orange-600">local Cloudflare development</span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-600">
              Visualize and interact with your D1 databases, KV namespaces, R2 buckets,
              Durable Objects, and Queues—all running locally.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4">
              <CopyCommand command="npx localflare" />
              <Link
                to="/docs"
                className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-700"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16">
            <div className="relative mx-auto max-w-5xl">
              {/* Browser frame */}
              <div className="rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 overflow-hidden">
                {/* Browser header */}
                <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded-full bg-zinc-300" />
                    <div className="size-3 rounded-full bg-zinc-300" />
                    <div className="size-3 rounded-full bg-zinc-300" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 rounded-md bg-white border border-zinc-200 px-3 py-1 text-xs text-zinc-500">
                      <span>localhost:8788</span>
                    </div>
                  </div>
                  <div className="w-[52px]" />
                </div>
                {/* Screenshot */}
                <img
                  src="/dashboard.png"
                  alt="Localflare Dashboard"
                  className="w-full"
                />
              </div>
              {/* Subtle glow effect */}
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-b from-orange-100/50 to-transparent blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Bindings */}
      <section className="py-12 border-y border-zinc-200">
        <div className="mx-auto max-w-6xl px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">Supported</span>
            <Binding icon={Database02Icon} name="D1" />
            <Binding icon={LayersLogoIcon} name="KV" />
            <Binding icon={FolderOpenIcon} name="R2" />
            <Binding icon={CloudIcon} name="DO" />
            <Binding icon={QueueIcon} name="Queues" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-orange-600">
                Zero Config
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-800">
                Reads your wrangler.toml
              </h2>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                Just run the command in your Worker project directory. Localflare automatically
                detects all your bindings and spins up the dashboard alongside your Worker.
              </p>

              <div className="mt-6 space-y-2">
                <Step number={1}>Navigate to your Worker project</Step>
                <Step number={2}>Run npx localflare</Step>
                <Step number={3}>Open localhost:8788</Step>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900 p-5">
              <div className="font-mono text-xs">
                <div className="text-zinc-500">$ npx localflare</div>
                <div className="mt-4 space-y-1.5 text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400">→</span>
                    Reading wrangler.toml...
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    Found 2 D1 databases
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    Found 3 KV namespaces
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    Found 1 R2 bucket
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400">✓</span>
                      Worker → localhost:8787
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400">✓</span>
                      Dashboard → <span className="text-orange-400">localhost:8788</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-16 border-t border-zinc-100">
        <div className="mx-auto max-w-6xl px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1 rounded-xl bg-zinc-900 p-5">
              <div className="font-mono text-xs text-zinc-400 space-y-2">
                <div className="text-zinc-500">// Single wrangler dev process</div>
                <div className="mt-3 pl-2 border-l-2 border-zinc-700 space-y-1">
                  <div>Your Worker <span className="text-zinc-600">→ localhost:8787</span></div>
                  <div className="text-zinc-600 text-[10px]">Your app code, untouched</div>
                </div>
                <div className="pl-2 border-l-2 border-orange-500/50 space-y-1">
                  <div>Localflare API <span className="text-zinc-600">→ /__localflare/*</span></div>
                  <div className="text-zinc-600 text-[10px]">Dashboard endpoints</div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <div className="text-zinc-500 mb-2">// Shared binding instances</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <span className="text-blue-400">D1</span>
                    <span className="text-green-400">KV</span>
                    <span className="text-purple-400">R2</span>
                    <span className="text-yellow-400">Queues</span>
                    <span className="text-pink-400">DO</span>
                    <span className="text-cyan-400">Services</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="text-xs font-medium uppercase tracking-widest text-orange-600">
                Multi-Worker Architecture
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-800">
                Real bindings, not mocks
              </h2>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                Localflare runs as a sidecar worker in the same wrangler process. Both workers share
                the exact same binding instances—your D1 writes show up instantly in the dashboard.
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Your code stays untouched—no SDK required</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Queue messages actually work and reach consumers</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Works with any framework—Hono, Remix, Next.js, etc.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Suspense fallback={<div className="py-16 border-t border-zinc-200" />}>
        <Testimonials />
      </Suspense>

      {/* Tech Stack */}
      <section className="py-12 border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-600">
            <div className="flex items-center gap-2">
              <span>Built on</span>
              <span className="font-semibold text-zinc-800">Wrangler</span>
            </div>
            <span className="hidden sm:block text-zinc-300">|</span>
            <div className="flex items-center gap-2">
              <span>Runs on</span>
              <span className="font-semibold text-zinc-800">workerd</span>
              <span className="text-zinc-500">— the same runtime as production</span>
            </div>
            <span className="hidden sm:block text-zinc-300">|</span>
            <div className="flex items-center gap-2">
              <span>API powered by</span>
              <span className="font-semibold text-zinc-800">Hono</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-8">
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-zinc-800">Get started</h2>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <code className="rounded-lg bg-white/80 border border-zinc-200 px-4 py-2 font-mono text-sm text-zinc-800">
                npm install -g localflare
              </code>
              <span className="text-zinc-500 text-sm">or</span>
              <code className="rounded-lg bg-white/80 border border-zinc-200 px-4 py-2 font-mono text-sm text-zinc-800">
                npx localflare
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded bg-orange-600">
                <span className="text-[8px] font-bold text-white">LF</span>
              </div>
              <span className="text-xs text-zinc-500">Localflare · MIT License</span>
            </div>

            <div className="flex items-center gap-5 text-xs text-zinc-500">
              <Link to="/docs" className="hover:text-zinc-700">Docs</Link>
              <a href="https://github.com/rohanprasadofficial/localflare" className="hover:text-zinc-700">GitHub</a>
              <a href="https://www.npmjs.com/package/localflare" className="hover:text-zinc-700">npm</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Binding({
  icon,
  name,
}: {
  icon: typeof Database02Icon;
  name: string;
}) {
  return (
    <div className="flex items-center gap-2 text-zinc-700">
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} className="text-zinc-500" />
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-medium text-zinc-600">
        {number}
      </span>
      <span className="text-sm text-zinc-700">{children}</span>
    </div>
  );
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-3 rounded-lg bg-white/80 border border-zinc-200 px-5 py-2.5 font-mono text-sm text-zinc-800 transition-colors hover:bg-white hover:border-zinc-300"
    >
      <span>{command}</span>
      <span className="text-zinc-400 transition-colors group-hover:text-zinc-600">
        {copied ? (
          <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={2} className="text-green-500" />
        ) : (
          <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
