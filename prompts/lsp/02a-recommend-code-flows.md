# Prompt: Recommend Code Flows (LSP-Optimized)

You are a documentation strategist. Your task is to analyze an architecture overview and recommend which code flows would be most valuable to document, using **LSP operations** to verify recommendations.

---

## LSP Enhancement

This prompt adds LSP verification to ensure recommended flows are traceable:
- **Verify entry points exist** via `documentSymbol`
- **Check call complexity** via `outgoingCalls`
- **Confirm components are real** via `workspaceSymbol`

---

## Prerequisites

Before using this prompt:
1. A completed `01-architecture-overview.md` for the codebase
2. Read that architecture overview
3. LSP server running for the target language

---

## Step 0: Read the Architecture Overview (MANDATORY)

Read the architecture overview document:
```
Read: pf-docs/01-architecture-overview.md
```

Extract and note:
- System classification
- Component map
- Execution surfaces (entry points)
- Data movement stages
- Any flows already suggested in Section 3.3

---

## Step 1: Identify Flow Candidates

For each execution surface in the architecture, evaluate:

| Question | If Yes → Action |
|----------|-----------------|
| Is this the primary user interaction? | **High priority** |
| Multiple components involved? | Check with `outgoingCalls` depth |
| Process is "magical" or opaque? | High value to demystify |
| Errors here cause confusion? | Document for debugging |
| Has async/background processing? | Document sync vs async boundary |

### LSP Verification for Each Candidate

**Verify the entry point exists:**
```
documentSymbol("path/to/suspected/file.ext")
→ Confirm the method/function is present
```

**Check flow complexity:**
```
outgoingCalls("file", line, char)
→ Count how many calls = complexity indicator
```

**If outgoingCalls returns 0-2 calls:** Low complexity, may not need detailed flow
**If outgoingCalls returns 3+ calls:** Worth documenting

### Flow Candidate Template

```markdown
### Flow: [Name]
- **Trigger**: What starts this flow?
- **Entry point**: [VERIFIED: documentSymbol found method]
- **Complexity**: Low / Medium / High (via outgoingCalls count)
- **Components involved**: [from workspaceSymbol verification]
- **User value**: Why document this?
```

---

## Step 2: Prioritize Flows

Score each candidate:

| Criterion | Score | LSP Verification |
|-----------|-------|------------------|
| **Frequency**: How often encountered? | 1-3 | - |
| **Complexity**: outgoingCalls depth | 1-3 | Count calls recursively |
| **Mystery**: How opaque? | 1-3 | - |
| **Debug value**: Helps troubleshooting? | 1-3 | - |

**Priority = Sum of scores**
- 10-12: High priority (document first)
- 7-9: Medium priority
- 4-6: Low priority (skip unless requested)

### LSP Complexity Check

```
// For each candidate entry point:
outgoingCalls("Controller.php", 45, 10)
→ Returns: 5 calls

// For each of those calls, check depth:
outgoingCalls on each result
→ Build call tree depth

Complexity scoring:
- Depth 1-2, <5 total calls: Low (1)
- Depth 2-3, 5-10 calls: Medium (2)
- Depth 3+, 10+ calls: High (3)
```

---

## Step 3: Generate Recommendations

Output format:

```markdown
# Code Flow Recommendations: [Project Name]

> Generated: [Date]
> Based on: [Architecture overview location]
> Verification: LSP

## Summary

| Flow | Priority | Complexity (LSP) | Components |
|------|----------|------------------|------------|
| [Name] | High | 3 (12 calls) | 5 |

---

## Recommended Flows

### 1. [Flow Name] (Priority: High)

**Why document this?**
[1-2 sentences on user value]

**Entry point:** [VERIFIED: documentSymbol]
- File: `path/to/file.ext`
- Method: `methodName()`
- Line: X

**Complexity assessment:** (via outgoingCalls)
- Direct calls: X
- Call tree depth: Y
- Total methods in flow: Z

**Key components:** (verified via workspaceSymbol)
- [Component 1] - [role] [VERIFIED]
- [Component 2] - [role] [VERIFIED]

**LSP trace starting point:**
```
outgoingCalls("file.ext", line, char)
→ First calls to follow: [list]
```

**Prompt to use:**
```
Create code flow documentation for [project] covering:
[Flow name] - [brief description]

Use LSP tracing starting from:
- File: path/to/file.ext
- Method: methodName at line X

Reference architecture at pf-docs/01-architecture-overview.md
```

---

### 2. [Next Flow]
...

---

## Skip These (Low Value)

| Flow | Why Skip | LSP Evidence |
|------|----------|--------------|
| [Name] | Too simple | outgoingCalls returned 2 calls |
| [Name] | Single component | No cross-component calls |

---

## Notes

[Caveats, dependencies between flows, suggested order]
```

---

## Step 4: Validate Recommendations

Before finalizing, verify with LSP:

- [ ] Each entry point confirmed via `documentSymbol`
- [ ] Complexity assessed via `outgoingCalls`
- [ ] Components verified via `workspaceSymbol`
- [ ] "Skip" section backed by LSP evidence
- [ ] Prompts include exact file:line for LSP tracing

---

## Output Location

Save recommendations to:
```
pf-docs/CODE-FLOW-RECOMMENDATIONS.md
```

---

## Example Recommendations (LSP-Verified)

```markdown
## Recommended Flows

### 1. Create Booking Flow (Priority: High - Score 11)

**Why document this?**
Core user action. Involves 4 components with external API call.

**Entry point:** [VERIFIED: documentSymbol("BookingController.php")]
- File: `app/Http/Controllers/BookingController.php`
- Method: `store()`
- Line: 45

**Complexity assessment:**
```
outgoingCalls("BookingController.php", 45, 10)
→ Direct calls: 4 (TimeSlot, Booking, event, redirect)

outgoingCalls on Booking::create
→ Triggers: BookingObserver::created

findReferences("BookingCreated")
→ Listeners: 1 (SyncToExternalCalendar)

Total call tree: 8 methods across 4 files
```
Complexity: High (3)

**Key components:**
- BookingController [VERIFIED: workspaceSymbol]
- Booking model [VERIFIED]
- BookingCreated event [VERIFIED]
- SyncToExternalCalendar [VERIFIED]

**LSP trace starting point:**
```
outgoingCalls("BookingController.php", 45, 10)
→ Follow: TimeSlot::findOrFail, Booking::create, event()
```

---

### 2. Calendar Sync Flow (Priority: Medium - Score 8)

**Why document this?**
External integration, common failure point.

**Entry point:** [VERIFIED: documentSymbol("SyncToExternalCalendar.php")]
- File: `app/Listeners/SyncToExternalCalendar.php`
- Method: `handle()`
- Line: 24

**Complexity assessment:**
```
outgoingCalls("SyncToExternalCalendar.php", 24, 10)
→ Direct calls: 2 (CalendarService::syncBooking, Booking::markSynced)
→ CalendarService makes Http::post
```
Complexity: Medium (2)

---

## Skip These

| Flow | Why Skip | LSP Evidence |
|------|----------|--------------|
| Show Booking | Display only | outgoingCalls: 1 call (Booking::find) |
| List Bookings | Query only | outgoingCalls: 1 call (Booking::paginate) |
```

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Guess at complexity | Use outgoingCalls to measure |
| Assume components exist | Verify with workspaceSymbol |
| Recommend without entry point | documentSymbol must confirm |
| Skip LSP verification | Every recommendation needs LSP backing |
