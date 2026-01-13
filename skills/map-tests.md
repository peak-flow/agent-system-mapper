---
description: Derive test candidates from verified code flows
---

# /map-tests — Test Surface Documentation

Read the methodology at `.pf-agent-system-mapper/prompts/05-test-surface.md`.

**Prerequisites:** A code flow document must exist at `pf-docs/02-code-flow-*.md`

If no code flow exists, tell the user to run `/map-flows` first.

**What this does:**
1. Read the code flow document
2. Identify observable outcomes
3. Extract invariants
4. Identify failure modes
5. Propose test candidates with priority scoring

**Critical rules:**
- Every test candidate must cite flow steps
- No invented behavior — only what the flow documents
- No test code — candidates only
- Prefer 5-10 high-value candidates over 30 trivial ones

**Output to:** `pf-docs/05-test-surface-{flow-name}.md`

Also read the example at `.pf-agent-system-mapper/examples/test-surface/good-test-surface-example.md` for proper format.
