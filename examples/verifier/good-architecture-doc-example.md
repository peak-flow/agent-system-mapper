# Architecture Overview: `verify.py` (mapper verifier)

> **This is the canonical CLI/library example for the agent-system-mapper methodology.**
>
> The system documented here ships inside the mapper distribution. Every citation
> resolves against `verify.py` and the other files in the install directory, so
> this example is self-verifiable wherever the mapper is installed.
>
> **To verify this example yourself:**
> ```bash
> # From an installed project:
> python3 .pf-agent-system-mapper/verify.py \
>     .pf-agent-system-mapper/examples/verifier/good-architecture-doc-example.md \
>     --repo-root .pf-agent-system-mapper
>
> # From the source repo:
> python3 verify.py examples/verifier/good-architecture-doc-example.md --repo-root .
> ```

## Metadata
| Field | Value |
|-------|-------|
| System | mapper verifier (`verify.py`) |
| Primary Language | Python (3.10+) |
| Documented Against | install dir layout (`verify.py`, `prompts/`, `examples/`, `README.md`) |
| Verification Status | `Verified` (self-test passes 100%) |

## Example Reference
| Field | Value |
|-------|-------|
| Methodology | `prompts/01-architecture-overview.md` (Step 8: verifier) |
| Key Format Elements | Tables in §3; explicit Boundaries; `[NOT_FOUND]` for negative scope; `path:line` citations resolve to in-bounds lines |

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | CLI Tool (single-file Python script with importable functions) |
| Evidence | `verify.py` is an executable script with `argparse` options and a `__main__` guard [VERIFIED: verify.py:1, verify.py:293-308]; no framework deps, no model files |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` |

---

## 1. System Purpose

`verify.py` is a doc-verification tool that runs *after* an agent writes an architecture document following the agent-system-mapper methodology. It parses every `[VERIFIED: path:line]` tag in the doc, confirms the cited file exists with the cited lines in range (phase 1), and — when a fenced code block immediately follows a tag — compares the quoted code against the actual file slice via `difflib.SequenceMatcher` (phase 2). The tool exits 0 on PASS, 1 on FAIL, so it integrates cleanly into CI or interactive iteration loops [VERIFIED: verify.py:1-12].

---

## 2. Component Map

### Core Data Model

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| `Citation` dataclass | `verify.py` | Holds `path`, `start`, `end` for one cited location; carries the `.check(root)` method that confirms file+line bounds | [VERIFIED: verify.py:40-62] |
| `Tag` dataclass | `verify.py` | Holds one parsed tag (`VERIFIED`, `NOT_FOUND`, etc.) with its citations and document line number | [VERIFIED: verify.py:64-69] |
| `QuoteCheck` dataclass | `verify.py` | Phase-2 result: tag + citation + ratio + first-diff hint | [VERIFIED: verify.py:139-147] |

### Parsing Pipeline

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| `TAG_RE` regex | `verify.py` | Matches top-level tag forms: `[VERIFIED]`, `[VERIFIED: ...]`, `[NOT_FOUND: ...]`, `[INFERRED]`, `[ASSUMED: ...]`, `[NEEDS_VERIFICATION]` | [VERIFIED: verify.py:24-26] |
| `FRESH_CITE` regex | `verify.py` | Picks `path:N(-N)?` citations out of a tag payload, requiring path to have a slash or an extension | [VERIFIED: verify.py:28-30] |
| `CONT_CITE` regex | `verify.py` | Picks shorthand continuations like `, M, P` reusing the previous path | [VERIFIED: verify.py:32] |
| `_extract_citations` | `verify.py` | Combines `FRESH_CITE` + `CONT_CITE` walks to expand shorthand into one Citation per cited line range | [VERIFIED: verify.py:72-114] |
| `_in_inline_code` | `verify.py` | Skips tag-shaped text inside `` `backticks` `` so doc-internal *descriptions* of the tag format aren't mistaken for citations | [VERIFIED: verify.py:116-125] |
| `parse_doc` | `verify.py` | Walks lines, applies `TAG_RE`, filters inline-code matches, expands citations | [VERIFIED: verify.py:127-136] |

### Phase 2 (Quoted-Code Matching)

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| `FENCE_RE` regex | `verify.py` | Detects fenced code block markers (`` ``` ``) with optional indentation | [VERIFIED: verify.py:34] |
| `_find_fenced_block` | `verify.py` | Looks ±N lines after a tag for a fence; returns block contents and opening-fence line | [VERIFIED: verify.py:149-170] |
| `_norm_lines` | `verify.py` | Strips trailing whitespace and trailing blank lines so trivial whitespace drift doesn't fail a match | [VERIFIED: verify.py:172-178] |
| `_diff_hint` | `verify.py` | Reports first-differing-line or length mismatch when a quote fails | [VERIFIED: verify.py:180-188] |
| `check_quoted_code` | `verify.py` | Orchestrates: tag → fenced block → file slice → `SequenceMatcher` ratio → pass/fail | [VERIFIED: verify.py:190-215] |
| `QUOTE_RATIO_PASS` constant | `verify.py` | Hard-coded similarity threshold for phase 2; deliberately looser than the citation threshold to tolerate minor whitespace drift | [VERIFIED: verify.py:37] |

### Top-Level Entry

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| `verify` function | `verify.py` | Reads the doc, runs phase 1 on all citations, runs phase 2 on tags with following fences, prints the report, returns the exit code | [VERIFIED: verify.py:217-291] |
| `main` + argparse | `verify.py` | CLI surface — accepts `doc`, `--repo-root`, `--threshold`, `-v` | [VERIFIED: verify.py:293-304] |
| `__main__` guard | `verify.py` | Standard `if __name__ == "__main__": sys.exit(main())` entry | [VERIFIED: verify.py:307-308] |

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|---------------|------|-----------------------------|----------|
| `python3 verify.py DOC` | CLI | `main` → `verify` → `parse_doc` → `Citation.check` → `check_quoted_code` | [VERIFIED: verify.py:293-308] |
| `python3 verify.py DOC --repo-root DIR` | CLI | Same, but resolves citations against `DIR` instead of cwd | [VERIFIED: verify.py:297-298] |
| `python3 verify.py DOC --threshold 0.9 -v` | CLI | Tightens/loosens phase-1 pass criterion; verbose mode lists every resolved citation and informal tag | [VERIFIED: verify.py:299-302] |
| `from verify import parse_doc, verify` | Library | The internal API is importable; no `__all__`, but functions are module-level | [INFERRED: standard Python module layout, no `__init__.py`] |

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input | Output | Participating Components |
|-------|-------|--------|--------------------------|
| Doc ingest | Markdown text | List of lines + raw text | `verify` (reads `doc_path`) |
| Tag extraction | Doc lines | List of `Tag` (kind, payload, doc_line, citations) | `parse_doc`, `TAG_RE`, `_in_inline_code` |
| Citation expansion | Tag payload string | List of `Citation` (path, start, end) | `_extract_citations`, `FRESH_CITE`, `CONT_CITE` |
| Phase 1 check | Citation + repo root | (pass/fail, reason) per citation | `Citation.check` |
| Phase 2 check | Tag + doc lines + repo root | `QuoteCheck` (ratio + diff hint) or `None` | `_find_fenced_block`, `_norm_lines`, `SequenceMatcher` (stdlib), `_diff_hint` |
| Reporting | Aggregated results | Stdout report + exit code | `verify` (final block) |

### 3.3 Pointers to Code Flow Documentation

Candidates for detailed flow tracing (see `02-code-flows.md`):

- **Doc → tags → citations** — the parse pipeline, including shorthand continuation handling
- **Phase 2 quote match** — fence discovery, slice extraction, normalization, similarity
- **Pass/fail aggregation** — how `cite_pass` and `quote_pass` combine into the final exit code

### Section 3 Self-Check
- [x] No method bodies longer than 3 lines quoted
- [x] No loops or conditionals described
- [x] All movements as conceptual stages
- [x] Defers to `02-code-flows.md`

---

## 3b. Frontend → Backend Interaction Map

Not applicable — `verify.py` is a CLI tool with no frontend. The only user surface is the terminal (stdout/stderr and exit code).

---

## 4. File/Folder Conventions

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| `verify.py` at install-dir root | Single-file CLI; no package directory, no `__init__.py` | [VERIFIED: verify.py:1] |
| `examples/verifier/` | Where this self-verifying example lives | [VERIFIED: this file exists alongside `verify.py`] |
| `prompts/01-architecture-overview.md` Step 8 | Where the methodology tells the agent to invoke this tool | [NOT_FOUND: this example deliberately doesn't cite a line in the prompt — the prompt structure changes more often than `verify.py`] |

---

## 5. External Dependencies

| Dependency | Purpose | Evidence |
|------------|---------|----------|
| Python stdlib `re` | Tag/citation/fence pattern matching | [VERIFIED: verify.py:16] |
| Python stdlib `argparse` | CLI argument parsing | [VERIFIED: verify.py:15] |
| Python stdlib `dataclasses` | `Citation`, `Tag`, `QuoteCheck` containers | [VERIFIED: verify.py:18] |
| Python stdlib `difflib.SequenceMatcher` | Phase 2 quote similarity scoring | [VERIFIED: verify.py:19] |
| Python stdlib `pathlib.Path` | File and repo-root resolution | [VERIFIED: verify.py:20] |

[NOT_FOUND: zero third-party dependencies. No `requirements.txt`, no `pyproject.toml` — this is a pure stdlib script and stays that way deliberately, so it can run anywhere the mapper is installed without an install step.]

---

## 6. Boundaries & Non-Responsibilities

Explicitly **NOT** in this tool:
- Auto-fixing the doc — the verifier never edits the doc; the agent must read failures and fix [VERIFIED: verify.py: only reads `doc_path`, never writes]
- Re-running grep for `[NOT_FOUND]` tags — `[NOT_FOUND]` is counted but not actively re-checked [VERIFIED: verify.py:235-237, NOT_FOUND falls through to `continue`]
- Fuzzy path matching — a citation to `bench/score.py` when the real file is `bench/scorer.py` fails as "missing file"; no Levenshtein-style suggestion is offered [VERIFIED: verify.py:43-44]
- Cross-file consistency (e.g., "did you cite this file twice with conflicting line ranges?") — out of scope
- Semantic check of *what the doc claims* — only that the cited evidence exists; if the doc says "this is a database" and cites a real line that says `import socket`, the verifier passes anyway

---

## 7. Known Issues & Risks

| Risk | Location | Notes |
|------|----------|-------|
| Inline-code skip is line-local | `verify.py:116-125` | Counts backticks within one line; a `` ` `` that opens on one line and closes on the next will desync detection. Multi-line inline code is rare in practice. |
| `--repo-root` is mandatory when example doesn't live next to its cited files | `verify.py:297-298` | This very example needs `--repo-root .pf-agent-system-mapper` because it sits in `examples/verifier/` but cites `verify.py:N` |
| File reads assume UTF-8 (with replace) | `verify.py:46`, `verify.py:206` | A truly binary file path would still "read" via replace and report incorrect line counts |
| `[NOT_FOUND]` payload not re-verified | `verify.py:235-237` | A future phase could re-grep the claimed search term to confirm the absence |

---

## 8. Entry Points Summary

| Entry Type | Count | Locations |
|------------|-------|-----------|
| CLI scripts | 1 | `verify.py` [VERIFIED: verify.py:1, verify.py:307-308] |
| CLI subcommands | 0 | flat argparse — one mode of operation [VERIFIED: verify.py:293-304] |
| Public library functions | 4 | `parse_doc`, `check_quoted_code`, `verify`, plus the dataclasses [VERIFIED: verify.py:127, verify.py:190, verify.py:217] |
| HTTP routes | 0 | [NOT_FOUND: no network] |
| Out-of-process commands | 0 | [NOT_FOUND: no `subprocess`, no shell-out] |

---

## 9. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| Language | Python 3.10+ (uses PEP 604 union syntax `X \| Y`) | [VERIFIED: verify.py:149-150 `tuple[list[str], int] \| None`] |
| CLI | `argparse` (stdlib) | [VERIFIED: verify.py:15] |
| Pattern matching | `re` (stdlib) | [VERIFIED: verify.py:16] |
| Similarity scoring | `difflib.SequenceMatcher` (stdlib) | [VERIFIED: verify.py:19] |
| Path handling | `pathlib` (stdlib) | [VERIFIED: verify.py:20] |
| External services | None | [NOT_FOUND: no network, no DB, no subprocess] |

---

## 10. Verification Summary

| Status | Count |
|--------|-------|
| VERIFIED | 32 |
| INFERRED | 1 |
| NOT_FOUND | 5 |
| ASSUMED | 0 |
| NEEDS_VERIFICATION | 0 |

Run the verifier against this very file to confirm:

```bash
python3 verify.py examples/verifier/good-architecture-doc-example.md --repo-root .
```

Expected: `Result: PASS (citation threshold 95%; quote threshold 90%)`.
