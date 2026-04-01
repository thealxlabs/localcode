# Contributing to Localcode

Thank you for your interest in contributing to Localcode! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm 9.0 or later
- Git

### Setup

```bash
git clone https://github.com/thealxlabs/localcode.git
cd localcode
npm install
npm run build
```

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Build and test: `npm run build`
5. Commit with conventional commits: `git commit -m 'feat: add your feature'`
6. Push and open a Pull Request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, no logic)
- `refactor:` — Code restructuring (no feature change)
- `perf:` — Performance improvements
- `test:` — Adding or updating tests
- `chore:` — Build process, dependencies, tooling
- `ci:` — CI/CD configuration changes

Examples:
```
feat: add multi-agent orchestration
fix: resolve file path resolution on Windows
docs: update README with new commands
refactor: simplify tool executor logic
```

## Pull Requests

- Fill out the PR template completely
- Link related issues
- Include screenshots for UI changes
- Ensure CI passes
- Request review from at least one maintainer

## Testing

```bash
# Build
npm run build

# Type check
npx tsc --noEmit

# Test manually
npm start
```

## Project Structure

```
src/
├── bin/          # CLI entry point
├── core/         # Core types and constants
├── providers/    # LLM provider abstraction
├── tools/        # Tool execution engine
├── agents/       # Agent system (registry, orchestration, dispatch)
├── sessions/     # Session management
├── mcp/          # MCP server support
├── plugins/      # Plugin system
├── settings/     # Settings management
└── ui/           # Terminal UI components

extensions/vscode/  # VS Code extension
```

## Adding Agents

Agents are markdown files in `~/.localcode/agents/`. Each file uses frontmatter:

```markdown
---
description: What this agent does
mode: subagent
---

You are a specialized agent that...
```

## Reporting Issues

- Use [GitHub Issues](https://github.com/thealxlabs/localcode/issues)
- Include reproduction steps
- Mention your OS, Node version, and Localcode version
- For security issues, see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
