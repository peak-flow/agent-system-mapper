---
description: Analyze architecture and recommend code flows to document, using LSP to verify entry points and measure complexity (experimental). Use when the user asks for LSP-verified flow recommendations or what to document next with LSP available.
---

# /map-recommend-lsp — Recommend Code Flows (LSP)

Read the base methodology at `.pf-agent-system-mapper/prompts/02a-recommend-code-flows.md`,
then the LSP overlay at `.pf-agent-system-mapper/prompts/lsp/02a-recommend-code-flows.md`
and follow both (the overlay replaces only the verification steps).

**Prerequisites:** Architecture overview must exist at `pf-docs/01-architecture-overview.md`
and an LSP server must be available for the target language.

If the overview doesn't exist, tell the user to run `/map-arch` (or `/map-arch-lsp`) first.

**What this does:**
1. Read the architecture overview
2. Identify flow candidates from execution surfaces
3. Verify entry points via `documentSymbol`, measure complexity via `outgoingCalls`
4. Output prioritized recommendations with exact `path:line` LSP trace starting points

**Output to:** `pf-docs/CODE-FLOW-RECOMMENDATIONS.md`

Focus on 2-4 high-value flows, not exhaustive coverage.
