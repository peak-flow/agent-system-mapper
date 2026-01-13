---
description: Document a specific code flow using agent-system-mapper methodology
---

# /map-flows — Code Flow Documentation

Read the methodology at `.pf-agent-system-mapper/prompts/02-code-flows.md` and follow it to document a specific execution path.

**Usage:** `/map-flows [flow-name]`

If no flow name is provided, ask the user which flow to document.

**Output to:** `pf-docs/02-code-flow-{flow-name}.md`

Follow ALL anti-hallucination rules:
- Cite every step with `[VERIFIED: file:line]`
- Follow the actual path by reading files
- Document dead ends with `[NOT_FOUND]`
- Distinguish sync vs async

If `.pf-agent-system-mapper/` doesn't exist, tell the user to run `/map-install` first.
