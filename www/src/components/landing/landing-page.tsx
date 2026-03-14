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
  Wifi01Icon,
  Globe02Icon,
} from '@hugeicons/core-free-icons';

const Testimonials = lazy(() =>
  import('./testimonials').then((m) => ({ default: m.Testimonials }))
);

export function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      icon: Database02Icon,
      name: 'D1',
      title: 'D1 Database Explorer',
      description: 'Browse tables, run SQL queries, and inspect your D1 databases with a beautiful interface.',
      color: 'text-blue-400',
    },
    {
      icon: LayersLogoIcon,
      name: 'KV',
      title: 'KV Namespace Browser',
      description: 'View, edit, and manage your KV key-value pairs. Search, filter, and export data easily.',
      color: 'text-emerald-400',
    },
    {
      icon: FolderOpenIcon,
      name: 'R2',
      title: 'R2 Object Storage',
      description: 'Drag & drop file uploads, folder tree view, file preview, and bucket management.',
      color: 'text-violet-400',
    },
    {
      icon: CloudIcon,
      name: 'Durable Objects',
      title: 'Durable Objects Inspector',
      description: 'Debug stateful objects, view storage, and monitor instance lifecycle in real-time.',
      color: 'text-rose-400',
    },
    {
      icon: QueueIcon,
      name: 'Queues',
      title: 'Queue Message Viewer',
      description: 'Monitor queue messages, inspect payloads, and track message delivery status.',
      color: 'text-amber-400',
    },
    {
      icon: Wifi01Icon,
      name: 'Network',
      title: 'Network Inspector',
      description: 'See every request in real-time. Inspect headers, bodies, and response times.',
      color: 'text-cyan-400',
    },
    {
      icon: Globe02Icon,
      name: 'Cloud',
      title: 'Cloud Mode',
      description: 'Connect to your live Cloudflare account. Browse production D1, KV, R2, and Queues without leaving Localflare.',
      color: 'text-orange-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-300 overflow-x-hidden relative">
      {/* Subtle dot pattern background */}
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none" />

      {/* Floating orange dots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] size-1 rounded-full bg-[#f97316] animate-pulse opacity-40" />
        <div className="absolute top-[25%] right-[15%] size-1.5 rounded-full bg-[#f97316] animate-pulse opacity-30" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[45%] left-[5%] size-1 rounded-full bg-[#f97316] animate-pulse opacity-25" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[60%] right-[8%] size-1 rounded-full bg-[#f97316] animate-pulse opacity-35" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-[75%] left-[20%] size-1.5 rounded-full bg-[#f97316] animate-pulse opacity-20" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[85%] right-[25%] size-1 rounded-full bg-[#f97316] animate-pulse opacity-30" style={{ animationDelay: '2.5s' }} />
        
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-sm border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c]">
              <span className="text-xs font-bold text-white">LF</span>
            </div>
            <span className="text-base font-semibold text-zinc-100">Localflare</span>
          </div>
          <nav className="flex items-center gap-8">
            <Link to="/docs" className="text-sm text-zinc-500 transition-colors hover:text-zinc-200">
              Docs
            </Link>
            <a
              href="https://github.com/rohanprasadofficial/localflare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
            >
              GitHub
            </a>
            <a
              href="https://x.com/rohanpdofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-label="X (Twitter)">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <Link
              to="/docs"
              className="rounded-full bg-[#f97316] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[#ea580c]"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-10">
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          {/* Badges */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 px-3 py-1 text-xs text-[#f97316]">
              <span className="size-1.5 rounded-full bg-[#f97316] animate-pulse" />
              Open Source
            </div>
            <a
              href="https://github.com/sponsors/rohanprasadofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs text-pink-400 transition-all hover:bg-pink-500/20"
            >
              <span>♥</span>
              Sponsor
            </a>
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl">
            The missing dashboard for
            <br />
            <span className="bg-gradient-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">
              Cloudflare development
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-500 sm:text-lg">
            Visualize and interact with your D1 databases, KV namespaces, R2 buckets,
            Durable Objects, and Queues—locally with real bindings or connected to your live Cloudflare account.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <CopyCommand command="npx localflare" />
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Text */}
            <div className="lg:pt-8">
              <p className="text-sm font-medium text-[#f97316] mb-3">
                Zero configuration
              </p>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-4 sm:text-3xl">
                From first line to full scale
              </h2>
              <p className="text-zinc-500 leading-relaxed mb-6">
                Run one command to start exploring your local Cloudflare bindings.
                Localflare reads your wrangler.toml and launches a dashboard automatically.
              </p>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100 hover:text-[#f97316] transition-colors"
              >
                Read the docs
                <span>→</span>
              </Link>
            </div>

            {/* Right: Terminal + Code Preview */}
            <div className="space-y-3">
              {/* Terminal */}
              <div className="rounded-lg bg-[#141414] border border-white/5 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-zinc-700" />
                    <div className="size-2.5 rounded-full bg-zinc-700" />
                    <div className="size-2.5 rounded-full bg-zinc-700" />
                  </div>
                  <span className="ml-2 text-xs text-zinc-600">localhost</span>
                </div>
                <div className="p-4 font-mono text-sm">
                  <div className="text-zinc-500 mb-2">~/my-worker-app <span className="text-emerald-500">git:(main)</span></div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">❯</span>
                    <span className="text-zinc-300">npx localflare</span>
                  </div>
                  <div className="mt-3 space-y-1 text-zinc-500 text-xs sm:text-sm">
                    <div>Reading wrangler.toml...</div>
                    <div className="text-zinc-400">Found bindings: <span className="text-blue-400">D1</span>, <span className="text-emerald-400">KV</span>, <span className="text-violet-400">R2</span></div>
                    <div className="text-zinc-400">Dashboard ready at <span className="text-[#f97316]">http://localhost:8788</span></div>
                  </div>
                </div>
              </div>

              {/* Code Preview */}
              <div className="rounded-lg bg-[#141414] border border-white/5 overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-xs">
                  <span className="text-zinc-600">wrangler.toml</span>
                </div>
                <div className="p-4 font-mono text-xs sm:text-sm text-zinc-500">
                  <div><span className="text-zinc-600">[</span><span className="text-[#f97316]">vars</span><span className="text-zinc-600">]</span></div>
                  <div><span className="text-zinc-400">MY_VAR</span> <span className="text-zinc-600">=</span> <span className="text-emerald-400">"hello"</span></div>
                  <div className="mt-2"><span className="text-zinc-600">[[</span><span className="text-[#f97316]">d1_databases</span><span className="text-zinc-600">]]</span></div>
                  <div><span className="text-zinc-400">binding</span> <span className="text-zinc-600">=</span> <span className="text-emerald-400">"DB"</span></div>
                  <div><span className="text-zinc-400">database_name</span> <span className="text-zinc-600">=</span> <span className="text-emerald-400">"my-database"</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-xl bg-[#141414] border border-white/5 overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#0d0d0d]">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-zinc-700" />
                <div className="size-2.5 rounded-full bg-zinc-700" />
                <div className="size-2.5 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-0.5 text-xs text-zinc-600">localhost:8788</div>
              </div>
              <div className="w-10" />
            </div>
            <img
              src="/dashboard.png"
              alt="Localflare Dashboard"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Feature Tabs */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-[#f97316] mb-3">
              Supported Bindings
            </p>
            <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
              Everything you need, in one dashboard
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {features.map((feature, index) => (
              <button
                key={feature.name}
                onClick={() => setActiveTab(index)}
                className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === index
                    ? 'bg-[#f97316] text-white'
                    : 'bg-[#141414] text-zinc-500 hover:text-zinc-300 border border-white/5'
                }`}
              >
                <HugeiconsIcon
                  icon={feature.icon}
                  size={16}
                  strokeWidth={2}
                  className={activeTab === index ? 'text-white' : feature.color}
                />
                {feature.name}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
            <div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3 sm:text-2xl">
                {features[activeTab].title}
              </h3>
              <p className="text-zinc-500 leading-relaxed mb-6 text-sm sm:text-base">
                {features[activeTab].description}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-zinc-400 text-sm">
                  <span className="text-emerald-500">✓</span>
                  Real bindings, not mocks
                </div>
                <div className="flex items-center gap-3 text-zinc-400 text-sm">
                  <span className="text-emerald-500">✓</span>
                  Zero configuration required
                </div>
                <div className="flex items-center gap-3 text-zinc-400 text-sm">
                  <span className="text-emerald-500">✓</span>
                  Works with any framework
                </div>
              </div>
            </div>

            {/* Feature Visual */}
            <div className="rounded-lg bg-[#141414] border border-white/5 p-5">
              <div className="font-mono text-sm space-y-2">
                <div className="flex items-center gap-2 text-zinc-600">
                  <span>❯</span>
                  <span className="text-zinc-400">npx localflare</span>
                </div>
                <div className="text-zinc-500 text-xs sm:text-sm">Scanning for bindings...</div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-zinc-400">Found <span className={features[activeTab].color}>{features[activeTab].name}</span> bindings</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-emerald-500">✓</span>
                  <span className="text-zinc-400">Dashboard ready at <span className="text-[#f97316]">localhost:8788</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
            {/* Diagram */}
            <div className="rounded-lg bg-[#141414] border border-white/5 p-6">
              <svg viewBox="0 0 400 260" className="w-full h-auto">
                {/* Connection lines with animation */}
                <path
                  d="M 100 65 Q 200 65 200 120"
                  fill="none"
                  stroke="#525252"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  className="animate-dash"
                  style={{ strokeDashoffset: 100 }}
                />
                <path
                  d="M 300 65 Q 200 65 200 120"
                  fill="none"
                  stroke="#525252"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  className="animate-dash"
                  style={{ strokeDashoffset: 100 }}
                />
                <path
                  d="M 200 160 L 200 185"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  className="animate-dash"
                  style={{ strokeDashoffset: 100 }}
                />

                {/* Your Worker Box */}
                <rect x="30" y="25" width="140" height="55" rx="6" fill="#141414" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="100" y="48" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="500">Your Worker</text>
                <text x="100" y="64" textAnchor="middle" fill="#525252" fontSize="9">localhost:8787</text>

                {/* Localflare Box */}
                <rect x="230" y="25" width="140" height="55" rx="6" fill="#141414" stroke="#f97316" strokeWidth="1.5" />
                <text x="300" y="48" textAnchor="middle" fill="#f97316" fontSize="11" fontWeight="500">Localflare</text>
                <text x="300" y="64" textAnchor="middle" fill="#525252" fontSize="9">/__localflare/*</text>

                {/* Wrangler Process */}
                <rect x="100" y="110" width="200" height="42" rx="6" fill="#141414" stroke="#262626" strokeWidth="1.5" />
                <text x="200" y="136" textAnchor="middle" fill="#71717a" fontSize="10">Wrangler Process</text>

                {/* Bindings */}
                <rect x="50" y="195" width="300" height="42" rx="6" fill="#141414" stroke="#262626" strokeWidth="1" />
                <text x="85" y="221" fill="#3b82f6" fontSize="9" fontWeight="500">D1</text>
                <text x="130" y="221" fill="#10b981" fontSize="9" fontWeight="500">KV</text>
                <text x="175" y="221" fill="#8b5cf6" fontSize="9" fontWeight="500">R2</text>
                <text x="220" y="221" fill="#f43f5e" fontSize="9" fontWeight="500">DO</text>
                <text x="265" y="221" fill="#f59e0b" fontSize="9" fontWeight="500">Queues</text>
                <text x="320" y="221" fill="#06b6d4" fontSize="9" fontWeight="500">Services</text>
              </svg>
            </div>

            {/* Content */}
            <div>
              <p className="text-sm font-medium text-[#f97316] mb-3">
                Multi-Worker Architecture
              </p>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-4 sm:text-3xl">
                Real bindings, not mocks
              </h2>
              <p className="text-zinc-500 leading-relaxed mb-6 text-sm sm:text-base">
                Localflare runs as a sidecar worker in the same wrangler process. Both workers share
                the exact same binding instances—your D1 writes show up instantly in the dashboard.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <div>
                    <span className="text-zinc-300 font-medium text-sm">Your code stays untouched</span>
                    <p className="text-zinc-600 text-xs mt-0.5">No SDK or modifications required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <div>
                    <span className="text-zinc-300 font-medium text-sm">Queue messages work properly</span>
                    <p className="text-zinc-600 text-xs mt-0.5">Messages reach consumers in real-time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <div>
                    <span className="text-zinc-300 font-medium text-sm">Works with any framework</span>
                    <p className="text-zinc-600 text-xs mt-0.5">Hono, Remix, Next.js, and more</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Mode */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-xs text-orange-400 mb-4">
                <HugeiconsIcon icon={Globe02Icon} size={12} strokeWidth={2} />
                New
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-4 sm:text-3xl">
                Local and cloud, one dashboard
              </h2>
              <p className="text-zinc-500 leading-relaxed mb-6 text-sm sm:text-base">
                Switch between your local dev environment and your live Cloudflare account with a single
                click. Browse production databases, inspect KV data, and manage R2 files—all without
                leaving Localflare.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  <div>
                    <span className="text-zinc-300 font-medium text-sm">One-click toggle</span>
                    <p className="text-zinc-600 text-xs mt-0.5">Switch between Local and Remote mode instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  <div>
                    <span className="text-zinc-300 font-medium text-sm">Full D1, KV, R2, and Queues support</span>
                    <p className="text-zinc-600 text-xs mt-0.5">Read and write to production resources via Cloudflare API</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  <div>
                    <span className="text-zinc-300 font-medium text-sm">Secure token-based auth</span>
                    <p className="text-zinc-600 text-xs mt-0.5">Uses Cloudflare API tokens with scoped permissions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="rounded-lg bg-[#141414] border border-white/5 p-5">
              <div className="font-mono text-sm space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-400">Local</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 px-3 py-1 text-xs">
                    <span className="size-1.5 rounded-full bg-orange-500" />
                    <span className="text-orange-400">Remote</span>
                  </div>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">&#10003;</span>
                    <span className="text-zinc-400">Connected to <span className="text-orange-400">Cloudflare API</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">&#10003;</span>
                    <span className="text-zinc-400">Found <span className="text-blue-400">3 D1 databases</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">&#10003;</span>
                    <span className="text-zinc-400">Found <span className="text-emerald-400">2 KV namespaces</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">&#10003;</span>
                    <span className="text-zinc-400">Found <span className="text-violet-400">5 R2 buckets</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">&#10003;</span>
                    <span className="text-zinc-400">Found <span className="text-amber-400">1 Queue</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Suspense fallback={<div className="py-24 border-t border-white/5" />}>
        <Testimonials />
      </Suspense>

      {/* Tech Stack */}
      <section className="py-12 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-zinc-600">
            <div className="flex items-center gap-1.5">
              <span>Built on</span>
              <span className="font-medium text-zinc-400">Wrangler</span>
            </div>
            <span className="text-zinc-800">·</span>
            <div className="flex items-center gap-1.5">
              <span>Runs on</span>
              <span className="font-medium text-zinc-400">workerd</span>
            </div>
            <span className="text-zinc-800">·</span>
            <div className="flex items-center gap-1.5">
              <span>API powered by</span>
              <span className="font-medium text-zinc-400">Hono</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-6 sm:text-3xl">Get started</h2>
          <div className="inline-block rounded-lg bg-[#141414] border border-white/5 px-6 py-3">
            <code className="font-mono text-sm text-zinc-400">npx localflare</code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-gradient-to-br from-[#f97316] to-[#ea580c]">
                <span className="text-[7px] font-bold text-white">LF</span>
              </div>
              <span className="text-xs text-zinc-600">Localflare · MIT License</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-zinc-600">
              <Link to="/docs" className="hover:text-zinc-300 transition-colors">Docs</Link>
              <a href="https://github.com/rohanprasadofficial/localflare" className="hover:text-zinc-300 transition-colors">GitHub</a>
              <a href="https://www.npmjs.com/package/localflare" className="hover:text-zinc-300 transition-colors">npm</a>
            </div>
          </div>
        </div>
      </footer>
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
      className="group flex items-center gap-3 rounded-xl bg-[#141414] border border-white/5 px-6 py-3.5 font-mono text-sm text-zinc-400 transition-all hover:border-white/10 hover:text-zinc-300"
    >
      <span>{command}</span>
      <span className="text-zinc-600 transition-colors group-hover:text-zinc-400">
        {copied ? (
          <HugeiconsIcon icon={Tick01Icon} size={16} strokeWidth={2} className="text-emerald-500" />
        ) : (
          <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
