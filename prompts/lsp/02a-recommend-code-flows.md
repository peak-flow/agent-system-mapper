# Overlay: Recommend Code Flows (LSP-Optimized)

You are a documentation strategist. **Follow the base prompt
`../02a-recommend-code-flows.md` in full** — its prerequisites, candidate
questions, scoring bands, output template, output location, and anti-patterns
all apply unchanged. This overlay ONLY replaces how you *verify* candidates:
use LSP operations instead of grep/file reading.

**Scope note:** `01-architecture-overview.md` (LSP variant) forbids
`outgoingCalls`/`incomingCalls`/`goToDefinition` — that prohibition applies to
the *architecture* document only, because architecture is discovery, not
tracing. Here, measuring call complexity is the whole point: `outgoingCalls`
is required.

---

## LSP Verification (replaces the base prompt's Step 1 verification)

For each flow candidate from the architecture overview:

**Verify the entry point exists:**
```
documentSymbol("path/to/suspected/file.ext")
→ Confirm the method/function is present
```

**Measure flow complexity:**
```
outgoingCalls("file", line, char)
→ Count direct calls, then check depth on each result

Complexity scoring (feeds the base prompt's 1-3 Complexity criterion):
- Depth 1-2, <5 total calls: Low (1)
- Depth 2-3, 5-10 calls: Medium (2)
- Depth 3+, 10+ calls: High (3)
```

**Confirm components are real:**
```
workspaceSymbol("ComponentName")
```

If `outgoingCalls` returns 0-2 calls the flow is likely too simple to document —
list it in the base template's "Skip These" section with the call count as
evidence.

---

## LSP Additions to the Output Template

Use the base prompt's output template, with these additions per recommended flow:

1. Cite entry points as `[VERIFIED: path:line — via documentSymbol]` — always
   `path:line` first (see `../00-verification-core.md`).
2. Add a **Complexity assessment** block showing the actual `outgoingCalls`
   counts and call-tree depth.
3. Add an **LSP trace starting point** block so 02-code-flows (LSP variant) can
   begin immediately:
   ```
   outgoingCalls("file.ext", line, char)
   → First calls to follow: [list]
   ```
4. In the "Skip These" table, back every skip with LSP evidence
   (e.g. `outgoingCalls returned 2 calls`).

---

## Validation Checklist (before finalizing)

- [ ] Base prompt `../02a-recommend-code-flows.md` followed for candidates, scoring, template
- [ ] Each entry point confirmed via `documentSymbol`, cited as `path:line`
- [ ] Complexity assessed via `outgoingCalls` (not guessed)
- [ ] Components verified via `workspaceSymbol`
- [ ] "Skip" section backed by LSP evidence
- [ ] Prompts include exact file:line for LSP tracing

---

## Example (LSP-Verified Recommendation)

```markdown
### 1. Create Booking Flow (Priority: High - Score 11)

**Why document this?**
Core user action. Involves 4 components with external API call.

**Entry point:** [VERIFIED: app/Http/Controllers/BookingController.php:45 — via documentSymbol]

**Complexity assessment:**
outgoingCalls("BookingController.php", 45, 10)
→ Direct calls: 4 (TimeSlot, Booking, event, redirect)
findReferences("BookingCreated")
→ Listeners: 1 (SyncToExternalCalendar)
Total call tree: 8 methods across 4 files → Complexity: High (3)

**LSP trace starting point:**
outgoingCalls("BookingController.php", 45, 10)
→ Follow: TimeSlot::findOrFail, Booking::create, event()
```
