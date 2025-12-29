# agent-system-mapper

A reference skill and training environment for teaching AI agents (and humans) how to construct verified, actionable mental models of software systems.

**This repository is not a production application.**

It exists to demonstrate how to map an unfamiliar codebase into agent-readable knowledge that supports safe modification, onboarding, and long-term system memory.

---

## What this repo teaches

- How to identify entry points, execution paths, and system boundaries
- How to trace code flows without hallucination
- How to surface invariants, risks, and change constraints
- How to separate what the system *does* from *why* it is the way it is
- How to produce documentation that both humans and AI agents can act on

---

## What this repo is NOT

- Not a framework
- Not a best-practices example
- Not a clean-architecture showcase
- Not intended for direct reuse in production

---

## Why it exists

Most documentation explains how code works.

Very little explains how to understand a system well enough to change it safely — especially with AI agents in the loop.

This repository exists to close that gap.

---

## Installation

Add the prompts to your project:

```bash
curl -sL https://raw.githubusercontent.com/peak-flow/agent-system-mapper/master/install.sh | bash
```

This creates `.pf-agent-system-mapper/` with prompts and examples.

---

## Usage

Ask your AI agent:

```
Read .pf-agent-system-mapper/prompts/01-architecture-overview.md
and document this codebase following that methodology.
See examples in .pf-agent-system-mapper/examples/ for good vs bad output.
```

The prompt will auto-detect your framework (Laravel, FastAPI, React, etc.) and reference the appropriate examples.

---

## Prompts Available

| Prompt | Purpose |
|--------|---------|
| `01-architecture-overview.md` | System components & structure (with framework detection) |
| `02-code-flows.md` | Execution path tracing |
| `03-data-models.md` | Schema & relationships |
| `04-diagrams.md` | Render verified docs as Mermaid |

---

## Framework-Specific Examples

Each framework has its own mini reference app and good/bad documentation examples:

| Framework | Mini App | Description |
|-----------|----------|-------------|
| Laravel | `examples/laravel/slotbooker/` | Booking system with MVC, events, services |
| FastAPI | `examples/fastapi/tasktracker/` | Task management API with repositories, Pydantic |
| React | `examples/react/` | *(coming soon)* |
| Vue | `examples/vue/` | *(coming soon)* |
| Livewire | `examples/livewire/` | *(coming soon)* |
| Flask | `examples/flask/` | *(coming soon)* |

Each framework folder contains:
- A mini reference app demonstrating that framework's patterns
- `good-architecture-doc-example.md` - Properly verified documentation
- `bad-architecture-doc-example.md` - Common hallucination patterns to avoid

### Package/Library Examples

For documenting standalone libraries (not web frameworks):

| Package | Language | Description |
|---------|----------|-------------|
| Requests | Python | HTTP client library |

Package examples are in `examples/packages/{package}/` with the same good/bad doc structure.

---

## Repository Structure

```
agent-system-mapper/
├── prompts/                     # AI agent prompts (what gets installed)
│   ├── 01-architecture-overview.md   # With framework detection
│   ├── 02-code-flows.md
│   ├── 03-data-models.md
│   └── 04-diagrams.md
├── examples/                    # Framework-specific examples
│   ├── laravel/
│   │   ├── slotbooker/         # Laravel mini app
│   │   ├── good-architecture-doc-example.md
│   │   └── bad-architecture-doc-example.md
│   ├── fastapi/
│   │   ├── tasktracker/        # FastAPI mini app
│   │   ├── good-architecture-doc-example.md
│   │   └── bad-architecture-doc-example.md
│   ├── react/                   # (coming soon)
│   ├── vue/                     # (coming soon)
│   ├── livewire/                # (coming soon)
│   ├── flask/                   # (coming soon)
│   └── packages/                # Library/package examples
│       └── requests/            # Python HTTP client
├── guides/                      # Methodology guides
│   └── 01-architecture-overview.md
└── install.sh                   # Installation script
```

---

## Getting Started (Contributors)

1. Read the guides in `guides/` to understand the methodology
2. Examine mini apps in `examples/{framework}/` as reference implementations
3. Review good vs bad examples to understand hallucination patterns
4. Test prompts against mini apps to validate changes

---

## Supported Frameworks

The architecture prompt auto-detects frameworks using these patterns:

| Framework | Detection |
|-----------|-----------|
| Laravel | `composer.json` with `laravel/framework` |
| FastAPI | `requirements.txt` with `fastapi` |
| React | `package.json` with `react` |
| Vue | `package.json` with `vue` |
| Livewire | Laravel + `livewire/livewire` in `composer.json` |
| Flask | `requirements.txt` with `flask` |

If your framework isn't supported yet, use Laravel examples as a baseline.
