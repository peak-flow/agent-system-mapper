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

### Then verify

After the agent writes the doc, run the verifier:

```bash
python3 .pf-agent-system-mapper/verify.py path/to/the-doc.md
```

The verifier exits 0 on PASS, 1 on FAIL. Two phases:
- **Citations** — every `[VERIFIED: path:line]` must resolve to a real file and an in-bounds line range (default ≥95%).
- **Quoted code** — when a fenced code block follows a tag, the block must match the cited file slice (default ≥90% similarity via `difflib`).

Pure Python stdlib — no install step, runs anywhere Python 3.10+ is available. See `examples/verifier/good-architecture-doc-example.md` for a self-verifying reference.

---

## Prompts Available

| Prompt | Purpose |
|--------|---------|
| `00-verification-core.md` | Canonical verification tags + verifier step (shared by all prompts) |
| `01-architecture-overview.md` | System components & structure (with framework detection) |
| `01a-overlay-model-systems.md` | Additional detection for ML/AI model systems |
| `02-code-flows.md` | Execution path tracing |
| `02a-recommend-code-flows.md` | Analyze architecture and recommend which flows to document |
| `03-data-models.md` | Schema & relationships |
| `04-diagrams.md` | Render verified docs as Mermaid |
| `05-test-surface.md` | Derive test candidates from verified code flows |

---

## Framework-Specific Examples

Each framework has its own mini reference app (or vendored source) and good/bad documentation examples:

| Framework | Source | Description |
|-----------|--------|-------------|
| Laravel | `examples/laravel/slotbooker/` | Booking system with MVC, events, services (+ code-flow example pair) |
| FastAPI | `examples/fastapi/tasktracker/` | Task management API with repositories, Pydantic |
| React | `examples/react/expense-tracker/` | SPA with hooks, routing |
| Next.js | `examples/nextjs/linkboard/` | App Router: server/client components, API routes |
| Vue | `examples/vue/kanban-board/` | Pinia store, optimistic updates |
| Livewire | `examples/livewire/approval-flow/` | Laravel + Livewire components |
| Model-centric (ML/AI) | `examples/model-systems/whisper/` | Vendored openai/whisper source — pairs with the `01a` overlay |

Each folder contains:
- The mini app / vendored source the docs cite
- `good-architecture-doc-example.md` - Properly verified documentation (**must pass `verify.py`** — enforced by `scripts/verify-examples.sh` in CI)
- `bad-architecture-doc-example.md` - Common hallucination patterns, annotated with ❌ callouts explaining each failure

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
│   ├── 00-verification-core.md       # Canonical tags + verifier step (shared)
│   ├── 01-architecture-overview.md   # With framework detection
│   ├── 01a-overlay-model-systems.md  # ML/AI model detection overlay
│   ├── 02-code-flows.md
│   ├── 02a-recommend-code-flows.md   # Analyze & recommend flows
│   ├── 03-data-models.md
│   ├── 04-diagrams.md
│   ├── 05-test-surface.md            # Test candidates from flows
│   └── lsp/                          # LSP-optimized variants
├── examples/                    # Every good example must pass verify.py (CI-enforced)
│   ├── laravel/                 # slotbooker mini app + architecture AND code-flow pairs
│   ├── fastapi/                 # tasktracker mini app + pair
│   ├── react/                   # expense-tracker mini app + pair
│   ├── nextjs/                  # linkboard mini app (App Router) + pair
│   ├── vue/                     # kanban-board mini app + pair
│   ├── livewire/                # approval-flow mini app + pair
│   ├── model-systems/           # vendored openai/whisper + pair (01a overlay)
│   ├── packages/
│   │   └── requests/            # vendored requests source + pair
│   ├── verifier/                # self-verifying example (documents verify.py)
│   └── test-surface/            # test surface pair (cites slotbooker)
├── skills/                      # Claude Code slash commands (/map-arch, /map-verify, ...)
├── scripts/
│   └── verify-examples.sh       # CI guard: every good example must PASS
├── verify.py                    # Two-phase doc verifier
└── install.sh                   # Installation script
```

---

## Getting Started (Contributors)

1. Read the prompts in `prompts/` to understand the methodology (`guides/` is superseded)
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
| Next.js | `package.json` with `next` |
| Vue | `package.json` with `vue` |
| Livewire | Laravel + `livewire/livewire` in `composer.json` |
| Model-centric (ML/AI) | Weights files, `torch`/`transformers` deps — loads the `01a` overlay |

If your framework isn't supported yet, use the packages/requests examples as a
generic baseline (or Laravel for web frameworks) and adapt terminology.
