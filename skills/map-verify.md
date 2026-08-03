---
description: Verify [VERIFIED file:line] citations and quoted code in a generated mapper doc. Use when the user asks to verify a doc, check citations, validate documentation, or after any map-arch/map-flows/map-data/map-tests run.
---

# /map-verify — Verify a Generated Doc

**Usage:** `/map-verify [path-to-doc]`

If no path is given, verify every markdown file in `pf-docs/`.

Run the two-phase structural verifier:

```bash
python3 .pf-agent-system-mapper/verify.py <doc>
```

| Phase | Checks | Threshold |
|-------|--------|-----------|
| 1 — citations | Every `[VERIFIED: path:line]` resolves to a real file and in-bounds lines | ≥95% |
| 2 — quoted code | Fenced blocks following a tag match the cited file slice | ≥90% similarity |

**On FAIL:** read the failure list (`doc:N  path:span — reason`), fix the DOC
(off-by-one lines, stale paths, paraphrased quotes), and re-run until it exits 0.
Never edit `verify.py` to suppress failures.

Use `--emit-summary` to print an accurate Verification Summary block to paste
into the doc — never hand-count tags.

If `.pf-agent-system-mapper/` doesn't exist, tell the user to run `/map-install` first.
