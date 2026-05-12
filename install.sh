#!/bin/bash

# Agent System Mapper - Install Script
# Downloads prompts and examples to .pf-agent-system-mapper/

set -e

REPO="peak-flow/agent-system-mapper"
BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TARGET_DIR=".pf-agent-system-mapper"

echo "Installing Agent System Mapper prompts..."

# Create directories
mkdir -p "${TARGET_DIR}/prompts"
mkdir -p "${TARGET_DIR}/prompts/lsp"
mkdir -p "${TARGET_DIR}/examples/laravel"
mkdir -p "${TARGET_DIR}/examples/fastapi"
mkdir -p "${TARGET_DIR}/examples/flask"
mkdir -p "${TARGET_DIR}/examples/livewire"
mkdir -p "${TARGET_DIR}/examples/react"
mkdir -p "${TARGET_DIR}/examples/vue"
mkdir -p "${TARGET_DIR}/examples/packages/requests"
mkdir -p "${TARGET_DIR}/examples/test-surface"

# Download standard prompts
echo "Downloading standard prompts..."
curl -sL "${BASE_URL}/prompts/01-architecture-overview.md" -o "${TARGET_DIR}/prompts/01-architecture-overview.md"
curl -sL "${BASE_URL}/prompts/01a-overlay-model-systems.md" -o "${TARGET_DIR}/prompts/01a-overlay-model-systems.md"
curl -sL "${BASE_URL}/prompts/02-code-flows.md" -o "${TARGET_DIR}/prompts/02-code-flows.md"
curl -sL "${BASE_URL}/prompts/02a-recommend-code-flows.md" -o "${TARGET_DIR}/prompts/02a-recommend-code-flows.md"
curl -sL "${BASE_URL}/prompts/03-data-models.md" -o "${TARGET_DIR}/prompts/03-data-models.md"
curl -sL "${BASE_URL}/prompts/04-diagrams.md" -o "${TARGET_DIR}/prompts/04-diagrams.md"
curl -sL "${BASE_URL}/prompts/05-test-surface.md" -o "${TARGET_DIR}/prompts/05-test-surface.md"

# Download LSP-optimized prompts
echo "Downloading LSP-optimized prompts..."
curl -sL "${BASE_URL}/prompts/lsp/01-architecture-overview.md" -o "${TARGET_DIR}/prompts/lsp/01-architecture-overview.md"
curl -sL "${BASE_URL}/prompts/lsp/02-code-flows.md" -o "${TARGET_DIR}/prompts/lsp/02-code-flows.md"
curl -sL "${BASE_URL}/prompts/lsp/02a-recommend-code-flows.md" -o "${TARGET_DIR}/prompts/lsp/02a-recommend-code-flows.md"
curl -sL "${BASE_URL}/prompts/lsp/README.md" -o "${TARGET_DIR}/prompts/lsp/README.md"

# Download framework-specific examples
echo "Downloading examples..."

# Laravel
curl -sL "${BASE_URL}/examples/laravel/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/laravel/good-architecture-doc-example.md"
curl -sL "${BASE_URL}/examples/laravel/bad-architecture-doc-example.md" -o "${TARGET_DIR}/examples/laravel/bad-architecture-doc-example.md"

# FastAPI
curl -sL "${BASE_URL}/examples/fastapi/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/fastapi/good-architecture-doc-example.md"
curl -sL "${BASE_URL}/examples/fastapi/bad-architecture-doc-example.md" -o "${TARGET_DIR}/examples/fastapi/bad-architecture-doc-example.md"

# Flask
curl -sL "${BASE_URL}/examples/flask/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/flask/good-architecture-doc-example.md" 2>/dev/null || true
curl -sL "${BASE_URL}/examples/flask/bad-architecture-doc-example.md" -o "${TARGET_DIR}/examples/flask/bad-architecture-doc-example.md" 2>/dev/null || true

# Livewire
curl -sL "${BASE_URL}/examples/livewire/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/livewire/good-architecture-doc-example.md"
curl -sL "${BASE_URL}/examples/livewire/bad-architecture-doc-example.md" -o "${TARGET_DIR}/examples/livewire/bad-architecture-doc-example.md"

# React
curl -sL "${BASE_URL}/examples/react/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/react/good-architecture-doc-example.md"
curl -sL "${BASE_URL}/examples/react/bad-architecture-doc-example.md" -o "${TARGET_DIR}/examples/react/bad-architecture-doc-example.md"

# Vue
curl -sL "${BASE_URL}/examples/vue/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/vue/good-architecture-doc-example.md"
curl -sL "${BASE_URL}/examples/vue/bad-architecture-doc-example.md" -o "${TARGET_DIR}/examples/vue/bad-architecture-doc-example.md"

# Package examples
echo "Downloading package examples..."

# Requests (Python HTTP client)
curl -sL "${BASE_URL}/examples/packages/requests/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/packages/requests/good-architecture-doc-example.md"
curl -sL "${BASE_URL}/examples/packages/requests/bad-architecture-doc-example.md" -o "${TARGET_DIR}/examples/packages/requests/bad-architecture-doc-example.md"

# Test surface examples (framework-agnostic)
echo "Downloading test surface examples..."
curl -sL "${BASE_URL}/examples/test-surface/good-test-surface-example.md" -o "${TARGET_DIR}/examples/test-surface/good-test-surface-example.md"
curl -sL "${BASE_URL}/examples/test-surface/bad-test-surface-example.md" -o "${TARGET_DIR}/examples/test-surface/bad-test-surface-example.md"

# Verifier — runs after the agent writes a doc to check every [VERIFIED: file:line]
# citation against the filesystem and (phase 2) match quoted code blocks against
# their cited source slices. See prompts/01-architecture-overview.md Step 8.
echo "Downloading verifier..."
curl -sL "${BASE_URL}/verify.py" -o "${TARGET_DIR}/verify.py"
chmod +x "${TARGET_DIR}/verify.py"

# Self-verifying example (documents verify.py itself; cites only files inside the
# install dir, so it resolves wherever the mapper is installed).
mkdir -p "${TARGET_DIR}/examples/verifier"
curl -sL "${BASE_URL}/examples/verifier/good-architecture-doc-example.md" -o "${TARGET_DIR}/examples/verifier/good-architecture-doc-example.md" 2>/dev/null || true

# Create README
cat > "${TARGET_DIR}/README.md" << 'README'
# .pf-agent-system-mapper

This directory contains agent-system-mapper prompts, examples, and a verifier.

The prompts and examples are guidance artifacts. The verifier (`verify.py`) is
runtime — it executes against a generated doc and exits non-zero on broken
citations or drifted quoted code.

**Safe to delete at any time.**

## What's here

- `prompts/` - Standard AI agent prompts (grep/file-based)
- `prompts/lsp/` - LSP-optimized prompts (~50% fewer tokens)
- `examples/` - Framework-specific good vs bad documentation examples
- `verify.py` - Two-phase verifier; run after the agent writes a doc

## Usage

### Standard Prompts (grep-based)
```
Read .pf-agent-system-mapper/prompts/01-architecture-overview.md
and document this codebase following that methodology.
```

### LSP Prompts (recommended if LSP available)
```
Read .pf-agent-system-mapper/prompts/lsp/01-architecture-overview.md
and document this codebase following that methodology.
```

The prompt will auto-detect your framework and use the appropriate examples.

## Verifying a generated doc

```
python3 .pf-agent-system-mapper/verify.py path/to/your-doc.md
```

Two-phase check:

| Phase | Checks | Threshold |
|-------|--------|-----------|
| 1 — citations | Every `[VERIFIED: path:line]` resolves to a real file and an in-bounds line range | ≥95% |
| 2 — quoted code | Each fenced block that follows a tag matches the cited file slice (via `difflib.SequenceMatcher`) | ≥90% similarity |

Exits 0 on PASS, 1 on FAIL. Failure lines point at the doc line, the offending citation, and a brief reason or first-diff hint. Run with `-v` to also list resolved citations and informal-evidence tags.

The methodology prompt's **Step 8** (Step 7 in the LSP variant) instructs the agent to run this and iterate on failures before declaring the doc complete.

## Prompt Versions

| Type | Token Usage | Best For |
|------|-------------|----------|
| **Standard** (`prompts/`) | 15-26k tokens | No LSP server, dynamic code |
| **LSP** (`prompts/lsp/`) | 7-12k tokens | LSP available, hitting session limits |

## Framework Examples

| Framework | Good Example | Bad Example |
|-----------|--------------|-------------|
| Laravel | `examples/laravel/good-architecture-doc-example.md` | `examples/laravel/bad-architecture-doc-example.md` |
| FastAPI | `examples/fastapi/good-architecture-doc-example.md` | `examples/fastapi/bad-architecture-doc-example.md` |
| Flask | `examples/flask/good-architecture-doc-example.md` | `examples/flask/bad-architecture-doc-example.md` |
| Livewire | `examples/livewire/good-architecture-doc-example.md` | `examples/livewire/bad-architecture-doc-example.md` |
| React | `examples/react/good-architecture-doc-example.md` | `examples/react/bad-architecture-doc-example.md` |
| Vue | `examples/vue/good-architecture-doc-example.md` | `examples/vue/bad-architecture-doc-example.md` |

## Package Examples

| Package | Good Example | Bad Example |
|---------|--------------|-------------|
| Requests | `examples/packages/requests/good-architecture-doc-example.md` | `examples/packages/requests/bad-architecture-doc-example.md` |

## Source

https://github.com/peak-flow/agent-system-mapper
README

echo ""
echo "Installed to ${TARGET_DIR}/"
echo ""
echo "Structure:"
echo "  ${TARGET_DIR}/"
echo "  ├── README.md"
echo "  ├── prompts/"
echo "  │   ├── 01-architecture-overview.md"
echo "  │   ├── 01a-overlay-model-systems.md"
echo "  │   ├── 02-code-flows.md"
echo "  │   ├── 02a-recommend-code-flows.md"
echo "  │   ├── 03-data-models.md"
echo "  │   ├── 04-diagrams.md"
echo "  │   ├── 05-test-surface.md"
echo "  │   └── lsp/"
echo "  │       ├── README.md"
echo "  │       ├── 01-architecture-overview.md (LSP-optimized)"
echo "  │       ├── 02-code-flows.md (LSP-optimized)"
echo "  │       └── 02a-recommend-code-flows.md (LSP-optimized)"
echo "  ├── examples/"
echo "  │   ├── laravel/"
echo "  │   ├── fastapi/"
echo "  │   ├── flask/"
echo "  │   ├── livewire/"
echo "  │   ├── react/"
echo "  │   ├── vue/"
echo "  │   ├── packages/"
echo "  │   │   └── requests/"
echo "  │   ├── verifier/                  (self-verifying example)"
echo "  │   └── test-surface/"
echo "  └── verify.py                      (run after the agent writes a doc)"
echo ""
echo "Usage:"
echo "  Standard prompts: Ask your AI to read .pf-agent-system-mapper/prompts/01-architecture-overview.md"
echo "  LSP prompts (50% fewer tokens): Ask your AI to read .pf-agent-system-mapper/prompts/lsp/01-architecture-overview.md"
echo "  Verify a generated doc: python3 .pf-agent-system-mapper/verify.py path/to/your-doc.md"
echo ""
