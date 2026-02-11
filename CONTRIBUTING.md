# Contributing to Localflare

Thanks for your interest in contributing to Localflare! This guide will help you get started.

## Code of Conduct

Be respectful, constructive, and collaborative. We're all here to make local Cloudflare Workers development better.

## Ways to Contribute

- **Report bugs** - Found something broken? Let us know
- **Suggest features** - Have ideas for improvements? We'd love to hear them
- **Fix issues** - Check our [issue tracker](https://github.com/rohanprasadofficial/localflare/issues) for open issues
- **Improve docs** - Documentation improvements are always welcome
- **Add tests** - Help us improve code coverage

## Getting Started

### Prerequisites

- **Node.js 22.13+** (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- **pnpm 9+** - Install with `npm install -g pnpm`
- **A Cloudflare Workers project** for testing

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/localflare.git
cd localflare
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build all packages**

```bash
pnpm build
```

4. **Start development**

```bash
# Terminal 1: Start the demo app worker and localflare API
cd demo-app
pnpm run dev:client
pnpm run dev:studio

# Terminal 2: Start the dashboard
cd packages/dashboard
pnpm run dev
```

5. **Open the dashboard**

Navigate to `http://localhost:5174/d1?port=8787`

### Project Structure

```
localflare/
├── packages/
│   ├── cli/           # Main CLI package (localflare command)
│   ├── api/           # API worker (dashboard backend)
│   ├── core/          # Config parser and shared utilities
│   └── dashboard/     # React dashboard UI
├── demo-app/          # Test application for development
└── www/               # Marketing website
```

### Development Workflow

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

2. **Make your changes**

- Write clear, focused commits
- Follow existing code style
- Add tests if applicable
- Update documentation if needed

3. **Test your changes**

```bash
# Build all packages
pnpm build

# Test with the demo app
cd demo-app
pnpm run dev:client

# Or test with your own Worker project
cd /path/to/your/worker
npx /path/to/localflare/packages/cli
```

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add support for X"
# or
git commit -m "fix: resolve issue with Y"
```

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

5. **Push and create a Pull Request**

```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub with:
- Clear description of what changed and why
- Reference any related issues (`Fixes #123`)
- Screenshots/videos for UI changes

## Package-Specific Guidelines

### CLI (`packages/cli`)

The CLI is the main entry point. Changes here affect how users interact with Localflare.

**Key files:**
- `src/index.ts` - CLI argument parsing and main logic
- `src/shadow-config.ts` - Wrangler config generation for sidecar
- `src/tui/` - Terminal UI components

**Testing:**
```bash
cd packages/cli
pnpm build
node dist/index.js --help
```

### API (`packages/api`)

The API worker provides REST endpoints for the dashboard.

**Key files:**
- `src/worker/index.ts` - Main worker entry point
- `src/worker/routes/` - API route handlers (D1, KV, R2, etc.)

**Testing:**
```bash
cd packages/api
pnpm build
# Test with demo-app or your own project
```

### Core (`packages/core`)

Shared utilities and config parsing. Changes here affect all packages.

**Key files:**
- `src/config.ts` - Wrangler config parser
- `src/types.ts` - TypeScript type definitions

**Testing:**
```bash
cd packages/core
pnpm build
pnpm typecheck
```

### Dashboard (`packages/dashboard`)

React UI for the web dashboard.

**Key files:**
- `src/components/` - React components for each binding type
- `src/lib/api.ts` - API client
- `src/components/ui/` - Reusable UI components

**Testing:**
```bash
cd packages/dashboard
pnpm dev
# Open http://localhost:5174
```

## Common Tasks

### Adding Support for a New Binding Type

1. **Update types** in `packages/core/src/types.ts`
2. **Add API routes** in `packages/api/src/worker/routes/`
3. **Create UI component** in `packages/dashboard/src/components/`
4. **Update manifest generation** in `packages/cli/src/shadow-config.ts`

### Fixing a Bug

1. **Reproduce the issue** - Verify you can reproduce it
2. **Write a test** - Add a test that fails with the bug
3. **Fix the bug** - Make the test pass
4. **Verify** - Test manually with demo-app or real project

### Improving Documentation

Documentation lives in:
- `README.md` - Main project documentation
- `packages/*/README.md` - Package-specific docs
- `CONTRIBUTING.md` - This file
- Code comments - Inline documentation

## Pull Request Guidelines

### Before Submitting

- [ ] Code builds without errors (`pnpm build`)
- [ ] Changes are tested manually
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format
- [ ] PR description explains what and why

### PR Title Format

Use conventional commit format:
```
feat(cli): add --config flag for custom config path
fix(dashboard): resolve D1 table pagination issue
docs: improve installation instructions
```

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge

## Architecture Overview

Localflare uses a **sidecar architecture**:

```
Single wrangler dev Process
├── Your Worker (port 8787)
│   └── Your application code
├── Localflare API Worker
│   └── Dashboard API (/__localflare/*)
└── Shared Bindings
    └── D1, KV, R2, Queues, DO
```

**How it works:**
1. CLI reads your `wrangler.toml`
2. Generates a shadow config with both workers
3. Starts wrangler with the combined config
4. Both workers share the same binding instances
5. Dashboard connects to API worker via `/__localflare/*` routes

## Debugging Tips

### CLI Issues

```bash
# Enable verbose logging
localflare --verbose

# Check generated shadow config
cat .wrangler/tmp/localflare-shadow-config.toml
```

### API Worker Issues

```bash
# Check wrangler logs
# Look for errors in the terminal running localflare
```

### Dashboard Issues

```bash
# Open browser DevTools
# Check Network tab for API calls
# Check Console for errors
```

### Build Issues

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## Getting Help

- **GitHub Issues** - [Report bugs or request features](https://github.com/rohanprasadofficial/localflare/issues)
- **Discussions** - [Ask questions or share ideas](https://github.com/rohanprasadofficial/localflare/discussions)
- **Twitter** - [@rohanpdofficial](https://x.com/rohanpdofficial)

## License

By contributing to Localflare, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Localflare! 🚀
