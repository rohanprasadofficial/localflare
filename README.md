# Localflare

Local development dashboard for Cloudflare Workers. Visualize and interact with your D1 databases, KV namespaces, R2 buckets, Durable Objects, and Queues during development.

## Features

- **D1 Database Explorer** - Browse tables, run SQL queries, edit data
- **KV Browser** - View, edit, and delete key-value pairs
- **R2 File Manager** - Upload, download, and manage objects
- **Queue Inspector** - Send test messages to queues
- **Durable Objects** - View and interact with DO instances
- **Zero Config** - Reads your `wrangler.toml` automatically
- **Framework Agnostic** - Works with any framework (Next.js, Nuxt, Remix, Hono, etc.)

## Quick Start

```bash
# Navigate to your Cloudflare Worker project
cd your-worker-project

# Run Localflare
npx localflare
```

That's it! Localflare will:
1. Detect your `wrangler.toml` configuration
2. Start your worker at `http://localhost:8787`
3. Open the dashboard at `https://studio.localflare.dev`

## Installation

```bash
npm install -g localflare
# or
pnpm add -g localflare
# or use directly with npx
npx localflare
```

## Usage

### Basic Usage

```bash
# Run in your Worker project directory
localflare

# Custom port
localflare --port 9000

# Don't open browser automatically
localflare --no-open
```

### Pass Wrangler Options

Use `--` to pass options directly to wrangler:

```bash
# Use a specific environment
localflare -- --env staging

# Set environment variables
localflare -- --var API_KEY:secret

# Combine options
localflare --port 9000 -- --env production --remote
```

### Attach Mode (for custom dev workflows)

For projects with custom dev commands (OpenNext, Nuxt, etc.), use attach mode:

```bash
# Terminal 1: Your dev server
pnpm dev        # or: opennext dev, nuxt dev, wrangler dev, etc.

# Terminal 2: Localflare API
localflare attach

# Custom port for Localflare API
localflare attach --port 9000
```

Attach mode runs the Localflare API separately, sharing the same `.wrangler/state` directory with your dev server.

### Options

```bash
localflare [configPath] [options]

Options:
  -p, --port <port>  Worker port (default: 8787)
  -v, --verbose      Verbose output
  --no-open          Don't open browser automatically
  --no-tui           Disable TUI, use simple console output
  --dev              Open local dashboard instead of studio.localflare.dev
  -h, --help         Display help
  --version          Display version

localflare attach [configPath] [options]

Options:
  -p, --port <port>  Localflare API port (default: 8788)
  --no-open          Don't open browser automatically
  --dev              Open local dashboard instead of studio.localflare.dev
```

## Requirements

- **Node.js 18+**
- **A Cloudflare Workers project** with `wrangler.toml`
- **wrangler dev** must work for your project (Localflare runs alongside wrangler)

### Supported Project Types

| Project Type | Mode | Command |
|--------------|------|---------|
| Standard Workers | Default | `npx localflare` |
| Hono, Remix, Astro, SvelteKit | Default | `npx localflare` |
| OpenNext (Next.js on Workers) | Attach | `npx localflare attach` |
| Nuxt on Workers | Attach | `npx localflare attach` |
| Custom wrangler setups | Attach | `npx localflare attach` |

## How It Works

Localflare uses a **sidecar architecture** that runs alongside your worker in the same wrangler process. Both workers share the exact same binding instances, enabling full read/write access to all your data.

```
Single wrangler dev Process
├── Your Worker (http://localhost:8787)
│   └── Your application code unchanged
├── Localflare API Worker
│   └── Dashboard API routes (/__localflare/*)
└── Shared Bindings
    ├── D1 databases (same instance)
    ├── KV namespaces (same instance)
    ├── R2 buckets (same instance)
    ├── Queues (same in-memory queue)
    └── Durable Objects (same instances)
```

This architecture means:
- **Your code stays untouched** - No SDK, no modifications needed
- **Real binding instances** - Not mocks, actual working bindings
- **Queue messages actually work** - Send messages that your consumer receives
- **Works with any framework** - If it runs on Workers, it works with Localflare

## Packages

| Package | Description |
|---------|-------------|
| `localflare` | CLI tool - the main entry point |
| `localflare-api` | API worker that powers the dashboard |
| `localflare-core` | Config parser and utilities |
| `localflare-dashboard` | React dashboard UI (hosted at studio.localflare.dev) |

## Development

```bash
# Clone the repo
git clone https://github.com/rohanprasadofficial/localflare
cd localflare

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Terminal 1: Start the demo app worker and localflare API
cd demo-app
pnpm run dev:client
pnpm run dev:studio

# Terminal 2: Start the dashboard
cd packages/dashboard
pnpm run dev

# Open the dashboard
# http://localhost:5174/d1?port=8787
```

## Supported Bindings

| Binding | Support | Dashboard Features |
|---------|---------|-------------------|
| D1 | ✅ Full | SQL editor, table browser, data CRUD |
| KV | ✅ Full | Key browser, value editor, bulk operations |
| R2 | ✅ Full | File browser, upload/download, metadata |
| Durable Objects | ✅ Full | Instance listing, state inspection |
| Queues | ✅ Full | Message viewer, send test messages |
| Service Bindings | ✅ Full | Automatic proxying |

## Sponsorship

If you find Localflare useful, please consider supporting its development:

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/rohanprasadofficial)

Your sponsorship helps with:
- Continued development and maintenance
- New features and binding support
- Documentation improvements
- Community support

**[Become a Sponsor](https://github.com/sponsors/rohanprasadofficial)**

## Links

- [Documentation](https://localflare.dev/docs)
- [GitHub](https://github.com/rohanprasadofficial/localflare)
- [npm](https://www.npmjs.com/package/localflare)
- [Twitter](https://x.com/rohanpdofficial)

## License

MIT
