# Localflare

Local development dashboard for Cloudflare Workers. Visualize and interact with your D1 databases, KV namespaces, R2 buckets, Durable Objects, and Queues during development.

<img width="1491" height="1000" alt="image" src="https://github.com/user-attachments/assets/913505fd-4c09-4c9e-9a41-44cfc89571af" />


## Features

- **D1 Database Studio** - Full-featured SQL editor, data browser with inline editing, filtering, sorting, bulk operations, and dummy data generation
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

# Custom persistence directory
localflare --persist-to ./my-data

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

Attach mode runs the Localflare API separately, sharing the same persistence directory with your dev server.

### Options

```bash
localflare [configPath] [options]

Options:
  -p, --port <port>        Worker port (default: 8787)
  -v, --verbose            Verbose output
  --no-open                Don't open browser automatically
  --no-tui                 Disable TUI, use simple console output
  --dev                    Open local dashboard instead of studio.localflare.dev
  --persist-to <path>     Persistence directory for D1/KV/R2/DO data (default: .wrangler/state)
  -h, --help               Display help
  --version                Display version

localflare attach [configPath] [options]

Options:
  -p, --port <port>        Localflare API port (default: 8788)
  --no-open                Don't open browser automatically
  --dev                    Open local dashboard instead of studio.localflare.dev
  --persist-to <path>     Persistence directory for D1/KV/R2/DO data (default: .wrangler/state)
```

## Requirements

- **Node.js 22.13+**
- **A Cloudflare Workers project** with `wrangler.toml`
- **wrangler dev** must work for your project (Localflare runs alongside wrangler)

## Browser Troubleshooting

The Localflare dashboard runs at `studio.localflare.dev` and connects to your local worker. Some browsers have security features that may block this connection.

### Chrome / Chromium

Recent Chrome updates may block [local network access](https://developer.chrome.com/blog/local-network-access) by default. This prevents the dashboard from connecting to your localhost worker.

**To fix:**

1. Click the lock/info icon in the URL bar (Site information)
2. Find "Local network access" or "Insecure content"
3. Set it to "Allow"
4. Refresh the page

### Safari / Brave

Safari and Brave block access to localhost from external sites by default. You need to install [mkcert](https://github.com/FiloSottile/mkcert) and generate a local CA:

```bash
# Install mkcert (macOS)
brew install mkcert

# Install the local CA
mkcert -install

# Restart your browser
```

**Brave alternative:** You can also disable Brave Shields for `studio.localflare.dev`:

1. Click the Brave Shields icon in the URL bar
2. Toggle shields off for this site

### Supported Project Types

| Project Type                  | Mode    | Command                 |
| ----------------------------- | ------- | ----------------------- |
| Standard Workers              | Default | `npx localflare`        |
| Hono, Remix, Astro, SvelteKit | Default | `npx localflare`        |
| OpenNext (Next.js on Workers) | Attach  | `npx localflare attach` |
| Nuxt on Workers               | Attach  | `npx localflare attach` |
| Custom wrangler setups        | Attach  | `npx localflare attach` |

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

| Package                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `localflare`           | CLI tool - the main entry point                      |
| `localflare-api`       | API worker that powers the dashboard                 |
| `localflare-core`      | Config parser and utilities                          |
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

| Binding          | Support | Dashboard Features                         |
| ---------------- | ------- | ------------------------------------------ |
| D1               | ✅ Full | Full-featured database studio (see below)  |
| KV               | ✅ Full | Key browser, value editor, bulk operations |
| R2               | ✅ Full | File browser, upload/download, metadata    |
| Durable Objects  | ✅ Full | Instance listing, state inspection         |
| Queues           | ✅ Full | Message viewer, send test messages         |
| Service Bindings | ✅ Full | Automatic proxying                         |

### D1 Database Studio

A comprehensive database management interface inspired by Drizzle Studio and Supabase:

**Data Browser**

- Paginated table data with customizable page sizes (25, 50, 100, 250 rows)
- Resizable columns with drag handles
- Column visibility toggle - show/hide columns
- Global search across all columns
- Column-level filtering (equals, not equals, contains, starts with, is null, is not null)
- Client-side and server-side sorting (ORDER BY toggle)
- Inline cell editing with auto-save
- Row actions: Edit dialog, Copy as JSON, Delete
- Bulk row selection and bulk delete
- Add new rows via form dialog
- **Generate Dummy Data** - Insert 1-100 rows of fake data using Faker.js
  - Supports all SQLite/D1 types: INTEGER, REAL, TEXT, DATE, DATETIME, TIMESTAMP, TIME, BOOLEAN, NUMERIC, DECIMAL, BLOB
  - Auto-skips auto-increment primary keys

**SQL Query Editor**

- Syntax highlighting with CodeMirror
- SQL autocomplete for tables, columns, and keywords
- Execute with Cmd/Ctrl + Enter keyboard shortcut
- Results displayed in table format
- Query history with re-run capability (persisted in localStorage)

**Schema Viewer**

- View table structure with column definitions
- Column types and primary key indicators
- Row counts per table

## Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

Check out our **[Contributing Guide](CONTRIBUTING.md)** to get started.

Before contributing:

1. Check existing [issues](https://github.com/rohanprasadofficial/localflare/issues) and [discussions](https://github.com/rohanprasadofficial/localflare/discussions)
2. Read the [Contributing Guide](CONTRIBUTING.md)
3. Follow the code style and conventions
4. Test your changes thoroughly

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
