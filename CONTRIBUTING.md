# Contributing to Chia

Thank you for your interest in contributing to Chia. This document explains the process for contributing to this project.

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/chiasdk.git
   cd chiasdk
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a branch for your work:
   ```bash
   git checkout -b your-branch-name
   ```

## Development Setup

This is a pnpm monorepo with the following packages:

- `packages/sdk` - The TypeScript SDK
- `packages/mcp` - The MCP server
- `examples/` - Usage examples

Build the SDK (required before building other packages):

```bash
pnpm --filter @chiahq/sdk build
```

Build the MCP server:

```bash
pnpm --filter @chiahq/mcp build
```

Run SDK tests:

```bash
pnpm --filter @chiahq/sdk test
```

Lint and format (SDK uses Biome):

```bash
pnpm --filter @chiahq/sdk lint
pnpm --filter @chiahq/sdk format
```

## Making Changes

### Code Style

- The SDK uses [Biome](https://biomejs.dev/) for linting and formatting. Run `pnpm lint` and `pnpm format` in the SDK directory before committing.
- Write TypeScript. All public APIs must be typed.
- Keep imports clean - re-export types from package roots so consumers do not need deep imports.
- Do not commit secrets, API keys, or credentials. Use environment variables.

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add mobile money collection API
fix(mcp): validate callback URLs to prevent SSRF
docs: update installation instructions
chore(deps): upgrade axios to 1.15.0
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Scope is optional but encouraged: `sdk`, `mcp`, `deps`, `docs`.

### Pull Requests

1. Make sure your branch is up to date with `master`:
   ```bash
   git fetch origin
   git rebase origin/master
   ```
2. Ensure the project builds without errors.
3. Run tests and linting.
4. Push your branch and open a pull request against `master`.
5. Fill out the PR description with:
   - A summary of what changed and why.
   - Steps to test the changes.
   - Any breaking changes.
6. A maintainer will review your PR. Address any feedback.

### What to Contribute

- Bug fixes
- New provider integrations
- Documentation improvements
- Test coverage
- Performance improvements
- Security hardening

If you are planning a large change, please open an issue first to discuss the approach before investing significant time.

## Reporting Bugs

Open an issue on GitHub with:

- A clear description of the problem.
- Steps to reproduce.
- Expected vs. actual behavior.
- Your environment (Node.js version, OS, package version).

## Requesting Features

Open an issue describing:

- The use case and problem you are trying to solve.
- Your proposed solution (if any).
- Any alternatives you considered.

## Code of Conduct

All participants are expected to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Please report unacceptable behavior to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
