# Verification Core (shared by all prompts)

This file is the single source of truth for verification tags and the
verifier step. Every mapper prompt references it — if a prompt's local
wording ever disagrees with this file, this file wins.

---

## Canonical Verification Tags

Use these tags for EVERY claim, in every document type:

| Tag | When to Use |
|-----|-------------|
| `[VERIFIED: path:line]` | You read the file and the code exists exactly as stated. Always cite `file:line` or `file:start-end`. |
| `[INFERRED]` | Logical conclusion from verified code (explain the reasoning) |
| `[NOT_FOUND: search description]` | You searched and couldn't find it (list the patterns you searched) |
| `[ASSUMED: reason]` | Based on framework convention, not verified code — use sparingly |
| `[NEEDS_VERIFICATION]` | Requires runtime or human confirmation |
| `[NEEDS_RUNTIME]` | Behavior depends on runtime state (code-flow docs) |
| `[DRIFT: description]` | Documented schema/code disagrees with another verified source (data-model docs) |

Rules that apply to every tag:

- No backticks, hedges, or disjunctions inside the brackets. `[VERIFIED: models.py likely ...]` and `[VERIFIED/NOT_FOUND]` are not tags — they are hallucination markers.
- A `[VERIFIED]` whose payload is an absence ("no training code found") is wrong — absences are `[NOT_FOUND: ...]`.
- When a fenced code block follows a `[VERIFIED: path:line]` tag, it must be an exact copy-paste of the cited slice — the verifier diff-checks it.

---

## The Verifier Step (MANDATORY for every generated doc)

After writing any doc, run the structural verifier:

```bash
python3 .pf-agent-system-mapper/verify.py <path-to-your-doc>
```

Two phases:

| Phase | Checks | Threshold |
|-------|--------|-----------|
| 1 — citations | Every `[VERIFIED: path:line]` resolves to a real file and an in-bounds line range | ≥95% |
| 2 — quoted code | Each fenced block following a tag matches the cited file slice (`difflib`) | ≥90% similarity |

A doc is only "done" when `verify.py` exits 0. If it doesn't:

1. **Read the failure list** — each line shows `doc:N  path:span — reason`.
2. **Fix the doc, not the verifier.** Common causes: off-by-one line numbers, stale paths, paraphrased quotes.
3. **Re-run** until PASS.

Run `verify.py --emit-summary <doc>` to print a ready-to-paste Verification
Summary block with accurate tag counts — never hand-count them.

For a worked example that passes, see
`.pf-agent-system-mapper/examples/verifier/good-architecture-doc-example.md`.
