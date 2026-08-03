---
description: Document a specific code flow using agent-system-mapper methodology. Use when the user asks to trace an execution path, document what happens when X, follow a feature through the code, or map a request lifecycle.
---

# /map-flows — Code Flow Documentation

Read the methodology at `.pf-agent-system-mapper/prompts/02-code-flows.md` and follow it to document a specific execution path.

**Usage:** `/map-flows [flow-name]`

If no flow name is provided, ask the user which flow to document.

**Before starting:** read the example pair at `.pf-agent-system-mapper/examples/laravel/good-code-flow-doc-example.md` and `bad-code-flow-doc-example.md` for the expected format and the hallucination patterns to avoid.

**Output to:** `pf-docs/02-code-flow-{flow-name}.md`

Follow ALL anti-hallucination rules:
- Cite every step with `[VERIFIED: file:line]`
- Follow the actual path by reading files
- Document dead ends with `[NOT_FOUND]`
- Distinguish sync vs async

**After writing:** run `python3 .pf-agent-system-mapper/verify.py pf-docs/02-code-flow-{flow-name}.md` and fix the doc until it exits 0 (PASS).

If `.pf-agent-system-mapper/` doesn't exist, tell the user to run `/map-install` first.
