---
description: Document code flows using LSP-optimized methodology (experimental). Use when the user asks to trace an execution path with LSP, or document a code flow with fewer tokens.
---

# /map-flows-lsp — Code Flow Documentation (LSP)

Read the LSP-optimized methodology at `.pf-agent-system-mapper/prompts/lsp/02-code-flows.md` and follow it to document a specific execution path.

**Usage:** `/map-flows-lsp [flow-name]`

If no flow name is provided, ask the user which flow to document.

**Key difference from /map-flows:**
- Uses LSP call hierarchy (outgoingCalls, incomingCalls, goToDefinition) instead of manual file reading
- ~60% fewer tokens consumed
- Automatically discovers call chains

**LSP Tracing Pattern:**
1. Find entry point via `documentSymbol`
2. Trace forward via `outgoingCalls`
3. Jump to definitions via `goToDefinition`
4. Find event listeners via `findReferences`

**Output to:** `pf-docs/02-code-flow-{flow-name}.md`

Follow ALL anti-hallucination rules:
- Cite every step with `[VERIFIED: path:line — via LSP operation]` — the `path:line` part is mandatory
- Use `outgoingCalls` to discover the call chain
- Document dead ends with `[NOT_FOUND: LSP operation returned empty]`

**After writing:** run `python3 .pf-agent-system-mapper/verify.py pf-docs/02-code-flow-{flow-name}.md` and fix the doc until it exits 0 (PASS).

If `.pf-agent-system-mapper/prompts/lsp/` doesn't exist, tell the user to run `/map-install` first.
