---
description: Generate architecture overview using LSP-optimized methodology (experimental). Use when the user asks for an LSP-based architecture overview, low-token codebase mapping, or to document architecture with LSP.
---

# /map-arch-lsp — Architecture Overview (LSP)

Read the LSP-optimized methodology at `.pf-agent-system-mapper/prompts/lsp/01-architecture-overview.md` and follow it to document this codebase.

**Key difference from /map-arch:**
- Uses LSP operations (workspaceSymbol, documentSymbol) instead of grep/find
- ~50% fewer tokens consumed
- Requires LSP server for the target language

**Before starting:**
1. Verify LSP is available by running `documentSymbol` on any source file
2. Read the appropriate example from `.pf-agent-system-mapper/examples/` based on detected framework

**Output to:** `pf-docs/01-architecture-overview.md`

Follow ALL anti-hallucination rules. Use `[VERIFIED: path:line — via LSP operation]` tags for every claim — the `path:line` part is mandatory or the verifier cannot resolve the citation.

**After writing:** run `python3 .pf-agent-system-mapper/verify.py pf-docs/01-architecture-overview.md` and fix the doc until it exits 0 (PASS).

If `.pf-agent-system-mapper/prompts/lsp/` doesn't exist, tell the user to run `/map-install` first.
