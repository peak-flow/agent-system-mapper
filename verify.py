#!/usr/bin/env python3
"""Verify [VERIFIED: file:line] citations in an architecture doc against the filesystem.

Phase 1 — structural: every cited path exists and every cited line is in bounds.
Phase 2 — quoted-code: when a fenced code block follows a `[VERIFIED: path:start-end]`
          tag, slice the file at start:end and compare with difflib.SequenceMatcher.
          Borrowed from codeneedle/bench/scorer.py — same primitive, different target.

Usage:
    python3 .pf-agent-system-mapper/verify.py pf-docs/01-architecture-overview.md
    python3 .pf-agent-system-mapper/verify.py DOC --repo-root . --threshold 0.95
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from pathlib import Path


# Top-level tag form: [VERIFIED: ...] / [NOT_FOUND: ...] / [INFERRED] / [ASSUMED: ...]
TAG_RE = re.compile(
    r"\[(VERIFIED|NOT_FOUND|INFERRED|ASSUMED|NEEDS_VERIFICATION)(?::\s*([^\]]+))?\]"
)
# Fresh citation: path with extension OR a slash, optionally backticked, then :N(-N)?
FRESH_CITE = re.compile(
    r"`?([\w./\-]+\.[a-zA-Z]+|[\w./\-]+/[\w./\-]+)`?:(\d+)(?:-(\d+))?"
)
# Continuation: `, N(-N)?` or `; N(-N)?` reusing the most recent path.
CONT_CITE = re.compile(r"[,;]\s*(\d+)(?:-(\d+))?")
# Opening or closing fenced code block (allow leading indent, optional language tag).
FENCE_RE = re.compile(r"^\s*```")
# Phase 2 quote-match threshold — looser than the citation threshold because
# normalized-line comparison can drift slightly (trailing whitespace, blanks).
QUOTE_RATIO_PASS = 0.90


@dataclass
class Citation:
    path: str
    start: int
    end: int  # == start for single-line citations

    def span(self) -> str:
        return f"{self.start}" if self.end == self.start else f"{self.start}-{self.end}"

    def check(self, root: Path) -> tuple[bool, str]:
        root = root.resolve()
        p = (root / self.path).resolve()
        if not p.is_relative_to(root):
            return False, f"path escapes repo root: {self.path}"
        if not p.is_file():
            return False, f"missing file: {self.path}"
        try:
            n_lines = sum(1 for _ in p.open(encoding="utf-8", errors="replace"))
        except Exception as e:
            return False, f"read error: {e}"
        if self.start < 1:
            return False, f"start line {self.start} < 1"
        if self.end > n_lines:
            return False, f"line {self.end} > file has {n_lines} lines"
        return True, "ok"


@dataclass
class Tag:
    kind: str
    payload: str | None
    citations: list[Citation] = field(default_factory=list)
    doc_line: int = 0


def _extract_citations(payload: str) -> list[Citation]:
    """Find all path:N (or path:N-M) citations, expanding `, M, P` shorthand
    that reuses the most recent path.

    Examples handled:
        bench/config.py:38                       -> [bench/config.py:38]
        bench/config.py:38, 91, 146              -> [38, 91, 146]
        bench/config.py:38, 91-95; 100           -> [38, 91-95, 100]
        bench.py:1, bench.py:231-316             -> [bench.py:1, bench.py:231-316]
        requirements.txt:1; bench/extract.py:130 -> [requirements.txt:1, bench/extract.py:130]
    """
    out: list[Citation] = []
    pos = 0
    last_path: str | None = None

    while pos < len(payload):
        fm = FRESH_CITE.search(payload, pos)
        cm = CONT_CITE.search(payload, pos) if last_path else None

        # Pick whichever match comes first; on ties, prefer the fresh path
        # (avoids cont regex stealing the comma in `path:1, path:2`).
        candidates = []
        if fm:
            candidates.append((fm.start(), 0, "fresh", fm))
        if cm:
            candidates.append((cm.start(), 1, "cont", cm))
        if not candidates:
            break
        candidates.sort()
        _, _, kind, m = candidates[0]

        if kind == "fresh":
            path, start, end = m.group(1), int(m.group(2)), m.group(3)
            out.append(Citation(path, start, int(end) if end else start))
            last_path = path
        else:  # continuation
            start, end = int(m.group(1)), m.group(2)
            assert last_path is not None
            out.append(Citation(last_path, start, int(end) if end else start))
        pos = m.end()

    return out


def _in_inline_code(line: str, pos: int) -> bool:
    """True if `pos` lies inside a `backtick-wrapped` span on this line.

    Documentation that *describes* the tag syntax (e.g., `[VERIFIED: file:line]`)
    isn't an active citation — it's prose about the methodology. We detect this
    by counting unescaped backticks before `pos`; an odd count means we're inside
    an inline-code span.
    """
    return line.count("`", 0, pos) % 2 == 1


def parse_doc(text: str) -> list[Tag]:
    tags: list[Tag] = []
    for i, line in enumerate(text.splitlines(), 1):
        for m in TAG_RE.finditer(line):
            if _in_inline_code(line, m.start()):
                continue
            kind, payload = m.group(1), m.group(2)
            cites = _extract_citations(payload) if (kind == "VERIFIED" and payload) else []
            tags.append(Tag(kind, payload, cites, doc_line=i))
    return tags


@dataclass
class QuoteCheck:
    tag: Tag
    citation: Citation
    fence_line: int          # doc line where the opening fence sits
    ratio: float             # 0.0..1.0 from SequenceMatcher
    passed: bool
    diff_hint: str = ""      # short one-line summary of where they diverge


def _find_fenced_block(doc_lines: list[str], tag_line: int, window: int = 4
                       ) -> tuple[list[str], int] | None:
    """Look for a fenced block whose opening fence is within `window` lines after
    `tag_line` (1-indexed). Returns (block_contents, fence_line) or None.

    Skips blank lines between the tag and the fence so list-formatted citations
    like `- [VERIFIED: ...]` + blank + ``` still match.
    """
    n = len(doc_lines)
    for offset in range(0, window + 1):
        i = tag_line - 1 + offset
        if not (0 <= i < n):
            continue
        if FENCE_RE.match(doc_lines[i]):
            block: list[str] = []
            for j in range(i + 1, n):
                if FENCE_RE.match(doc_lines[j]):
                    return block, i + 1
                block.append(doc_lines[j])
            return None  # unclosed fence
    return None


def _norm_lines(lines: list[str]) -> list[str]:
    """Match codeneedle's _norm + trailing-blank trim — strict but trailing-ws tolerant."""
    out = [l.rstrip() for l in lines]
    while out and out[-1] == "":
        out.pop()
    return out


def _diff_hint(expected: list[str], actual: list[str]) -> str:
    """Find the first differing line and report it. Empty string if identical."""
    for i in range(min(len(expected), len(actual))):
        if expected[i] != actual[i]:
            return f"first diff at offset {i}: expected {expected[i]!r}, got {actual[i]!r}"
    if len(expected) != len(actual):
        return f"length mismatch: expected {len(expected)} lines, got {len(actual)}"
    return ""


def check_quoted_code(tag: Tag, doc_lines: list[str], repo_root: Path
                      ) -> QuoteCheck | None:
    """If the tag has exactly one citation and a fenced block follows it,
    compare the block to the cited slice of the file. Returns None when phase 2
    has nothing to say (no fence, or file missing). Works for single-line
    citations too — a fence following `path:9` is still a quote-anchor.
    """
    if len(tag.citations) != 1:
        return None
    c = tag.citations[0]
    found = _find_fenced_block(doc_lines, tag.doc_line)
    if found is None:
        return None
    block, fence_line = found
    p = (repo_root / c.path).resolve()
    if not p.is_file():
        return None
    try:
        file_lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return None
    if c.end > len(file_lines):
        return None  # phase-1 already flagged this
    actual = _norm_lines(file_lines[c.start - 1 : c.end])
    quoted = _norm_lines(block)
    ratio = SequenceMatcher(a=actual, b=quoted, autojunk=False).ratio()
    hint = _diff_hint(actual, quoted) if ratio < 1.0 else ""
    return QuoteCheck(tag, c, fence_line, ratio, ratio >= QUOTE_RATIO_PASS, hint)


def verify(doc_path: Path, repo_root: Path, threshold: float, verbose: bool) -> int:
    text = doc_path.read_text()
    doc_lines = text.splitlines()
    tags = parse_doc(text)

    counts: dict[str, int] = {}
    cite_total = cite_ok = 0
    failures: list[tuple[Tag, Citation, str]] = []
    informal: list[Tag] = []
    quote_checks: list[QuoteCheck] = []

    for tag in tags:
        counts[tag.kind] = counts.get(tag.kind, 0) + 1
        if tag.kind != "VERIFIED":
            continue
        if not tag.citations:
            informal.append(tag)
            continue
        for c in tag.citations:
            cite_total += 1
            ok, reason = c.check(repo_root)
            if ok:
                cite_ok += 1
                if verbose:
                    print(f"  PASS  doc:{tag.doc_line:>4}  {c.path}:{c.span()}")
            else:
                failures.append((tag, c, reason))
        qc = check_quoted_code(tag, doc_lines, repo_root)
        if qc is not None:
            quote_checks.append(qc)

    pct = (cite_ok / cite_total * 100) if cite_total else 0.0
    quotes_ok = sum(1 for q in quote_checks if q.passed)

    print(f"\nVerification report — {doc_path}")
    print(f"  Tag counts:     {counts}")
    print(f"  Citations:      {cite_ok}/{cite_total} resolved ({pct:.1f}%)")
    print(f"  Informal tags:  {len(informal)} (VERIFIED with no file:line)")
    print(f"  Quoted blocks:  {quotes_ok}/{len(quote_checks)} match cited source"
          + (f" (≥{QUOTE_RATIO_PASS:.0%} similarity)" if quote_checks else ""))

    if informal and verbose:
        print("\nInformal VERIFIED tags (prose evidence, not auto-checkable):")
        for tag in informal:
            preview = (tag.payload or "")[:80]
            print(f"  doc:{tag.doc_line:>4}  {preview}")

    if failures:
        print(f"\nFailed citations ({len(failures)}):")
        for tag, c, reason in failures:
            print(f"  doc:{tag.doc_line:>4}  {c.path}:{c.span()}  — {reason}")

    quote_fails = [q for q in quote_checks if not q.passed]
    if quote_fails:
        print(f"\nFailed quoted blocks ({len(quote_fails)}):")
        for q in quote_fails:
            print(f"  doc:{q.tag.doc_line:>4}  {q.citation.path}:{q.citation.span()}"
                  f"  ratio={q.ratio:.2f}")
            if q.diff_hint:
                print(f"    {q.diff_hint}")

    if verbose and quote_checks:
        print("\nQuoted-block details:")
        for q in quote_checks:
            mark = "PASS" if q.passed else "FAIL"
            print(f"  {mark}  doc:{q.tag.doc_line:>4}  {q.citation.path}:{q.citation.span()}"
                  f"  ratio={q.ratio:.2f}")

    cite_pass = cite_total > 0 and pct >= threshold * 100
    quote_pass = all(q.passed for q in quote_checks)
    passed = cite_pass and quote_pass
    print(f"\nResult: {'PASS' if passed else 'FAIL'} "
          f"(citation threshold {threshold:.0%}; quote threshold {QUOTE_RATIO_PASS:.0%})")
    return 0 if passed else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("doc", type=Path, help="architecture doc to verify")
    ap.add_argument("--repo-root", type=Path, default=Path("."),
                    help="repo to resolve citations against (default: cwd)")
    ap.add_argument("--threshold", type=float, default=0.95,
                    help="min fraction of citations that must resolve (default: 0.95)")
    ap.add_argument("-v", "--verbose", action="store_true",
                    help="list every resolved citation and every informal tag")
    args = ap.parse_args()
    if not (0.0 <= args.threshold <= 1.0):
        ap.error("--threshold must be between 0.0 and 1.0")
    return verify(args.doc, args.repo_root.resolve(), args.threshold, args.verbose)


if __name__ == "__main__":
    sys.exit(main())
