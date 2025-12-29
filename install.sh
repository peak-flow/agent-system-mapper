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
mkdir -p "${TARGET_DIR}/examples/laravel"
mkdir -p "${TARGET_DIR}/examples/fastapi"
mkdir -p "${TARGET_DIR}/examples/flask"
mkdir -p "${TARGET_DIR}/examples/livewire"
mkdir -p "${TARGET_DIR}/examples/react"
mkdir -p "${TARGET_DIR}/examples/vue"

# Download prompts
echo "Downloading prompts..."
curl -sL "${BASE_URL}/prompts/01-architecture-overview.md" -o "${TARGET_DIR}/prompts/01-architecture-overview.md"
curl -sL "${BASE_URL}/prompts/01a-overlay-model-systems.md" -o "${TARGET_DIR}/prompts/01a-overlay-model-systems.md"
curl -sL "${BASE_URL}/prompts/02-code-flows.md" -o "${TARGET_DIR}/prompts/02-code-flows.md"
curl -sL "${BASE_URL}/prompts/03-data-models.md" -o "${TARGET_DIR}/prompts/03-data-models.md"
curl -sL "${BASE_URL}/prompts/04-diagrams.md" -o "${TARGET_DIR}/prompts/04-diagrams.md"

# Download framework-specific examples
echo "Downloading examples..."

# Laravel
curl -sL "${BASE_URL}/examples/laravel/good-architecture.md" -o "${TARGET_DIR}/examples/laravel/good-architecture.md"
curl -sL "${BASE_URL}/examples/laravel/bad-architecture.md" -o "${TARGET_DIR}/examples/laravel/bad-architecture.md"

# FastAPI
curl -sL "${BASE_URL}/examples/fastapi/good-architecture.md" -o "${TARGET_DIR}/examples/fastapi/good-architecture.md"
curl -sL "${BASE_URL}/examples/fastapi/bad-architecture.md" -o "${TARGET_DIR}/examples/fastapi/bad-architecture.md"

# Flask
curl -sL "${BASE_URL}/examples/flask/good-architecture.md" -o "${TARGET_DIR}/examples/flask/good-architecture.md" 2>/dev/null || true
curl -sL "${BASE_URL}/examples/flask/bad-architecture.md" -o "${TARGET_DIR}/examples/flask/bad-architecture.md" 2>/dev/null || true

# Livewire
curl -sL "${BASE_URL}/examples/livewire/good-architecture.md" -o "${TARGET_DIR}/examples/livewire/good-architecture.md"
curl -sL "${BASE_URL}/examples/livewire/bad-architecture.md" -o "${TARGET_DIR}/examples/livewire/bad-architecture.md"

# React
curl -sL "${BASE_URL}/examples/react/good-architecture.md" -o "${TARGET_DIR}/examples/react/good-architecture.md"
curl -sL "${BASE_URL}/examples/react/bad-architecture.md" -o "${TARGET_DIR}/examples/react/bad-architecture.md"

# Vue
curl -sL "${BASE_URL}/examples/vue/good-architecture.md" -o "${TARGET_DIR}/examples/vue/good-architecture.md"
curl -sL "${BASE_URL}/examples/vue/bad-architecture.md" -o "${TARGET_DIR}/examples/vue/bad-architecture.md"

# Create README
cat > "${TARGET_DIR}/README.md" << 'README'
# .pf-agent-system-mapper

This directory contains agent-system-mapper prompts and examples.

They are guidance artifacts only and have no runtime effect.

**Safe to delete at any time.**

## What's here

- `prompts/` - AI agent prompts for documenting codebases
- `examples/` - Framework-specific good vs bad documentation examples

## Usage

Ask your AI agent:
```
Read .pf-agent-system-mapper/prompts/01-architecture-overview.md
and document this codebase following that methodology.
```

The prompt will auto-detect your framework and use the appropriate examples.

## Framework Examples

| Framework | Good Example | Bad Example |
|-----------|--------------|-------------|
| Laravel | `examples/laravel/good-architecture.md` | `examples/laravel/bad-architecture.md` |
| FastAPI | `examples/fastapi/good-architecture.md` | `examples/fastapi/bad-architecture.md` |
| Flask | `examples/flask/good-architecture.md` | `examples/flask/bad-architecture.md` |
| Livewire | `examples/livewire/good-architecture.md` | `examples/livewire/bad-architecture.md` |
| React | `examples/react/good-architecture.md` | `examples/react/bad-architecture.md` |
| Vue | `examples/vue/good-architecture.md` | `examples/vue/bad-architecture.md` |

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
echo "  │   ├── 03-data-models.md"
echo "  │   └── 04-diagrams.md"
echo "  └── examples/"
echo "      ├── laravel/"
echo "      ├── fastapi/"
echo "      ├── flask/"
echo "      ├── livewire/"
echo "      ├── react/"
echo "      └── vue/"
echo ""
echo "Usage:"
echo "  Ask your AI agent to read .pf-agent-system-mapper/prompts/01-architecture-overview.md"
echo "  and document your codebase following that methodology."
echo ""
