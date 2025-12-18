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
mkdir -p "${TARGET_DIR}/examples"

# Download prompts
echo "Downloading prompts..."
curl -sL "${BASE_URL}/prompts/01-architecture-overview.md" -o "${TARGET_DIR}/prompts/01-architecture-overview.md"
curl -sL "${BASE_URL}/prompts/02-code-flows.md" -o "${TARGET_DIR}/prompts/02-code-flows.md"
curl -sL "${BASE_URL}/prompts/03-data-models.md" -o "${TARGET_DIR}/prompts/03-data-models.md"
curl -sL "${BASE_URL}/prompts/04-diagrams.md" -o "${TARGET_DIR}/prompts/04-diagrams.md"

# Download examples
echo "Downloading examples..."
curl -sL "${BASE_URL}/examples/good-architecture-overview.md" -o "${TARGET_DIR}/examples/good-architecture-overview.md"
curl -sL "${BASE_URL}/examples/bad-architecture-overview.md" -o "${TARGET_DIR}/examples/bad-architecture-overview.md"

# Create README
cat > "${TARGET_DIR}/README.md" << 'README'
# .pf-agent-system-mapper

This directory contains agent-system-mapper prompts and examples.

They are guidance artifacts only and have no runtime effect.

**Safe to delete at any time.**

## What's here

- `prompts/` - AI agent prompts for documenting codebases
- `examples/` - Good vs bad documentation examples

## Usage

Ask your AI agent:
```
Read .pf-agent-system-mapper/prompts/01-architecture-overview.md
and document this codebase following that methodology.
```

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
echo "  │   ├── 02-code-flows.md"
echo "  │   ├── 03-data-models.md"
echo "  │   └── 04-diagrams.md"
echo "  └── examples/"
echo "      ├── good-architecture-overview.md"
echo "      └── bad-architecture-overview.md"
echo ""
echo "Usage:"
echo "  Ask your AI agent to read .pf-agent-system-mapper/prompts/01-architecture-overview.md"
echo "  and document your codebase following that methodology."
echo ""
