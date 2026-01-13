#!/bin/bash

# Agent System Mapper - Skills Install Script
# Installs Claude Code slash commands to ~/.claude/commands/

set -e

REPO="peak-flow/agent-system-mapper"
BRANCH="master"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TARGET_DIR="$HOME/.claude/commands"

echo "Installing Agent System Mapper skills..."
echo ""

# Create commands directory if it doesn't exist
mkdir -p "${TARGET_DIR}"

# Download skills
echo "Downloading skills to ${TARGET_DIR}..."

# Core skills
curl -fSL "${BASE_URL}/skills/map-install.md" -o "${TARGET_DIR}/map-install.md"
curl -fSL "${BASE_URL}/skills/map-arch.md" -o "${TARGET_DIR}/map-arch.md"
curl -fSL "${BASE_URL}/skills/map-flows.md" -o "${TARGET_DIR}/map-flows.md"
curl -fSL "${BASE_URL}/skills/map-data.md" -o "${TARGET_DIR}/map-data.md"
curl -fSL "${BASE_URL}/skills/map-diagrams.md" -o "${TARGET_DIR}/map-diagrams.md"
curl -fSL "${BASE_URL}/skills/map-recommend.md" -o "${TARGET_DIR}/map-recommend.md"
curl -fSL "${BASE_URL}/skills/map-tests.md" -o "${TARGET_DIR}/map-tests.md"

# LSP-optimized skills
curl -fSL "${BASE_URL}/skills/map-arch-lsp.md" -o "${TARGET_DIR}/map-arch-lsp.md"
curl -fSL "${BASE_URL}/skills/map-flows-lsp.md" -o "${TARGET_DIR}/map-flows-lsp.md"

echo ""
echo "Installed skills:"
echo "  /map-install      - Install prompts to project"
echo "  /map-arch         - Generate architecture overview"
echo "  /map-arch-lsp     - Architecture (LSP, 50% fewer tokens)"
echo "  /map-flows        - Document code flow"
echo "  /map-flows-lsp    - Code flow (LSP, 60% fewer tokens)"
echo "  /map-data         - Document data models"
echo "  /map-diagrams     - Generate Mermaid diagrams"
echo "  /map-recommend    - Recommend flows to document"
echo "  /map-tests        - Derive test candidates"
echo ""
echo "Restart Claude Code for skills to appear."
echo ""
echo "Usage:"
echo "  1. Run /map-install in your project"
echo "  2. Run /map-arch to document architecture"
echo "  3. Run /map-flows to trace specific flows"
echo ""
