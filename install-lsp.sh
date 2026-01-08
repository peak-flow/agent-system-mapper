#!/bin/bash

# Agent System Mapper - LSP Prompts Install Script
# Downloads LSP-optimized prompts for testing
# These use LSP operations instead of grep/file reading

set -e

REPO="peak-flow/agent-system-mapper"
BRANCH="feature/lsp-prompts"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TARGET_DIR=".pf-agent-system-mapper"

echo "Installing Agent System Mapper LSP prompts..."
echo ""
echo "Note: These are EXPERIMENTAL prompts that use LSP operations."
echo "      Requires Claude Code's LSP tool to be available."
echo ""

# Create directory
mkdir -p "${TARGET_DIR}/prompts-lsp"

# Download LSP prompts
echo "Downloading LSP-optimized prompts..."
curl -fSL "${BASE_URL}/prompts-lsp/01-architecture-overview.md" -o "${TARGET_DIR}/prompts-lsp/01-architecture-overview.md"
curl -fSL "${BASE_URL}/prompts-lsp/02-code-flows.md" -o "${TARGET_DIR}/prompts-lsp/02-code-flows.md"
curl -fSL "${BASE_URL}/prompts-lsp/02a-recommend-code-flows.md" -o "${TARGET_DIR}/prompts-lsp/02a-recommend-code-flows.md"
curl -fSL "${BASE_URL}/prompts-lsp/README.md" -o "${TARGET_DIR}/prompts-lsp/README.md"

echo ""
echo "Installed to ${TARGET_DIR}/prompts-lsp/"
echo ""
echo "Structure:"
echo "  ${TARGET_DIR}/"
echo "  └── prompts-lsp/"
echo "      ├── README.md"
echo "      ├── 01-architecture-overview.md"
echo "      ├── 02-code-flows.md"
echo "      └── 02a-recommend-code-flows.md"
echo ""
echo "Usage:"
echo "  Ask Claude Code to read .pf-agent-system-mapper/prompts-lsp/01-architecture-overview.md"
echo "  and document your codebase following that methodology."
echo ""
echo "Token savings: ~50-55% vs standard prompts"
echo ""
echo "Note: Standard prompts (prompts/) are NOT installed."
echo "      Run the main install.sh if you need both versions."
echo ""
