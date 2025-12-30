# Prompt: Test Surface from Code Flow

You are a verification agent. Your task is to analyze a **previously verified Code Flow document** and derive **test candidates** that would validate the system's behavior.

---

## What is a Test Surface Document?

A Test Surface document identifies **what should be tested** based on verified code flows. It answers:

- What behaviors are externally observable?
- What invariants must hold true?
- What failure modes exist?
- What *kinds* of tests would validate this flow?

It is NOT:
- Test code generation (no PHPUnit/Jest/PyTest code)
- Framework selection (no mocking strategy decisions)
- Edge case invention (only what the flow implies)

---

## Scope Rule

**This document prioritizes high-impact, flow-defining behaviors.**

Do NOT enumerate trivial invariants (e.g., "method returns value", "array is not empty") unless they affect:
- **Correctness** — system produces wrong results if violated
- **Safety** — security or data integrity at risk
- **External behavior** — users or downstream systems are impacted

Prefer fewer, higher-value test candidates over exhaustive coverage.

---

## Prerequisites

Before using this prompt, you MUST have:

1. A completed Code Flow document created using `02-code-flows.md`
2. Verified `[VERIFIED: file:line]` references for each step
3. Read the Code Flow document in full

**DO NOT proceed without a verified Code Flow document.**

---

## Anti-Hallucination Rules (CRITICAL)

### Rule 1: Ground Every Test Candidate in the Flow

Each test candidate MUST reference the flow step(s) that justify it:

```markdown
Test Candidate: Booking status transitions to 'confirmed'
Based on: Step 3, Step 5 of Code Flow
[VERIFIED: BookingController.php:55, BookingService.php:89]
```

### Rule 2: No Invented Behavior

You may only propose tests for:
- Behavior explicitly shown in the Code Flow
- Failure modes logically implied by the code
- Invariants stated or inferable from verified code

You may NOT:
- Invent edge cases not implied by the flow
- Assume features that weren't traced
- Add tests for "what would be nice to have"

### Rule 3: Use Verification Tags

| Tag | Use When |
|-----|----------|
| `[VERIFIED]` | Behavior is explicitly shown in code flow |
| `[INFERRED]` | Behavior follows logically from verified code |
| `[NOT_FOUND]` | Behavior is undefined or missing in codebase |

### Rule 4: Distinguish Test Types Clearly

| Type | What It Tests | Scope |
|------|---------------|-------|
| Unit | Single function/method in isolation | One component |
| Integration | Multiple components working together | Component boundaries |
| E2E | Full flow from trigger to outcome | Entire path |

---

## Step 0: Read the Code Flow Document (MANDATORY)

Read the Code Flow document and extract:

```markdown
## Flow Reference
| Field | Value |
|-------|-------|
| Flow Document | [path to code flow doc] |
| Flow Name | [e.g., "User Login Flow"] |
| Steps Count | [number of steps in flow] |
| Trigger | [what starts this flow] |
| Final Outcome | [what the flow produces] |
```

---

## Step 1: Identify Observable Outcomes

For each step in the flow, list externally observable outcomes:

| Outcome Type | Examples |
|--------------|----------|
| HTTP Response | Status code, response body, headers |
| Database Write | Row created, field updated, record deleted |
| Event Fired | Event class dispatched, payload contents |
| External API Call | Request made, expected response |
| State Transition | Object status changed, flag set |
| File System | File created, modified, deleted |
| Queue/Job | Job dispatched, payload contents |

**Only include outcomes that are externally observable** — not internal variable assignments.

### Output Format

```markdown
## Observable Outcomes

| Step | Outcome | Type | Evidence |
|------|---------|------|----------|
| Step 3 | Booking record created | Database Write | [VERIFIED: BookingService.php:45] |
| Step 5 | BookingCreated event fired | Event | [VERIFIED: BookingService.php:52] |
| Step 7 | 201 Created response | HTTP Response | [VERIFIED: BookingController.php:67] |
```

---

## Step 2: Extract Invariants

For each observable outcome, identify invariants — conditions that MUST hold true:

### Invariant Types

| Type | Example |
|------|---------|
| State | "Status must be 'confirmed' after step Y" |
| Ordering | "Event must fire AFTER database write" |
| Cardinality | "Event must fire exactly once" |
| Conditional | "External call must NOT occur if condition Z" |
| Data Integrity | "Created record must have non-null user_id" |

### Output Format

```markdown
## Invariants

### Invariant 1: Booking status must be 'confirmed' after controller returns
- **Type**: State
- **Based on**: Step 5 of Code Flow
- **Evidence**: [VERIFIED: BookingService.php:55]

### Invariant 2: BookingCreated event fires exactly once per booking
- **Type**: Cardinality
- **Based on**: Step 5 of Code Flow
- **Evidence**: [VERIFIED: BookingService.php:52] — single dispatch call, no loop

### Invariant 3: Email notification must NOT send if booking fails validation
- **Type**: Conditional
- **Based on**: [INFERRED] — notification dispatch occurs after successful save
- **Evidence**: [VERIFIED: BookingService.php:48-55]
```

---

## Step 3: Identify Failure Modes

Based on the flow, identify where and how the flow could fail:

### Failure Categories

| Category | Questions to Ask |
|----------|------------------|
| Dependency Failure | What if a service returns null? Throws? |
| Validation Failure | What if input is invalid? |
| State Conflict | What if resource is already in wrong state? |
| External Failure | What if API call fails? Times out? |
| Missing Listener | What if event has no handler? |
| Race Condition | What if concurrent request modifies state? |

### Output Format

```markdown
## Failure Modes

### Failure Mode 1: Database constraint violation on duplicate booking
- **Step**: Step 3 (Booking creation)
- **Cause**: User already has booking for this slot
- **Expected Behavior**: [NOT_FOUND] — no unique constraint visible in flow
- **Risk**: High — could create duplicate bookings

### Failure Mode 2: Payment service timeout
- **Step**: Step 4 (Payment processing)
- **Cause**: External payment API unresponsive
- **Expected Behavior**: [VERIFIED: PaymentService.php:78] — throws PaymentException
- **Risk**: Medium — exception is caught but rollback not verified
```

---

## Step 4: Propose Test Candidates

For each invariant and failure mode, propose a test candidate.

**Quality over quantity:** Prefer 5-10 high-value test candidates over 30 trivial ones. Each candidate should test something that matters — if it fails, would anyone care?

### Test Candidate Format

```markdown
## Test Candidates

### Test 1: Booking status transitions correctly on success
- **Type**: Integration
- **Priority**: High
- **Validates**:
  - Booking created with status='pending'
  - Event fired after save
  - Status updated to 'confirmed'
- **Based on**: Steps 3, 5, 7 of Code Flow
- **Preconditions**: Valid user, available time slot
- **Expected Outcome**: Booking exists with status='confirmed'
- **Verification**: [VERIFIED: BookingService.php:45-55]

### Test 2: Booking fails gracefully on duplicate slot
- **Type**: Integration
- **Priority**: High
- **Validates**:
  - Validation rejects duplicate booking
  - No event fired
  - Error response returned
- **Based on**: [INFERRED] from Step 2 validation
- **Preconditions**: User already has booking for slot
- **Expected Outcome**: 422 response, no booking created
- **Verification**: [NOT_FOUND] — duplicate check not visible in flow

### Test 3: BookingCreated event contains correct payload
- **Type**: Unit
- **Priority**: Medium
- **Validates**:
  - Event payload includes booking_id
  - Event payload includes user_id
  - Event payload includes timestamp
- **Based on**: Step 5 of Code Flow
- **Preconditions**: Successful booking creation
- **Expected Outcome**: Event fired with complete payload
- **Verification**: [VERIFIED: Events/BookingCreated.php:15-22]
```

---

## Step 5: Risk-Based Prioritization

Rank test candidates using this scoring:

| Criterion | Score | Description |
|-----------|-------|-------------|
| Impact | 1-3 | What breaks if this fails? (3 = critical path) |
| Likelihood | 1-3 | How likely is regression? (3 = frequently changed) |
| External Effects | 1-3 | Does it affect users/money/data? (3 = yes) |

**Priority = Sum of scores**
- 7-9: Critical — must have test
- 4-6: Important — should have test
- 1-3: Nice to have — test if time permits

### Output Format

```markdown
## Test Priority Matrix

| Test Candidate | Impact | Likelihood | External | Priority |
|----------------|--------|------------|----------|----------|
| Booking status transitions | 3 | 2 | 3 | 8 (Critical) |
| Duplicate booking rejected | 3 | 2 | 2 | 7 (Critical) |
| Event payload correct | 2 | 1 | 1 | 4 (Important) |
| Payment timeout handled | 3 | 1 | 3 | 7 (Critical) |
```

---

## Step 6: Identify Test Gaps

Document areas where testing is difficult or impossible based on current code:

```markdown
## Test Gaps

| Gap | Reason | Recommendation |
|-----|--------|----------------|
| Email sending | No test double injection point | Refactor to inject mailer |
| Payment rollback | Transaction boundary unclear | Verify rollback behavior manually |
| Rate limiting | [NOT_FOUND] in flow | Add rate limiting before testing |
```

---

## Output Document Structure

Save the complete Test Surface document as:

```
pf-docs/05-test-surface-{flow-name}.md
```

### Complete Document Template

```markdown
# Test Surface: {Flow Name}

## Metadata
| Field | Value |
|-------|-------|
| Flow Document | {path} |
| Generated | {date} |
| Flow Steps | {count} |

## 1. Observable Outcomes
{table from Step 1}

## 2. Invariants
{list from Step 2}

## 3. Failure Modes
{list from Step 3}

## 4. Test Candidates
{list from Step 4}

## 5. Priority Matrix
{table from Step 5}

## 6. Test Gaps
{table from Step 6}

## Verification Summary
| Status | Count |
|--------|-------|
| VERIFIED | {n} |
| INFERRED | {n} |
| NOT_FOUND | {n} |
```

---

## Explicit Non-Goals

This document:

- Does NOT generate test code
- Does NOT select test frameworks
- Does NOT assume mocking strategies
- Does NOT invent edge cases not implied by the flow
- Does NOT replace human judgment on test implementation

---

## Example: Good vs Bad Test Candidate

### Good Test Candidate

```markdown
### Test: User session created after successful login
- **Type**: Integration
- **Validates**: Session record exists with correct user_id and expiry
- **Based on**: Step 4 of Login Flow
- **Verification**: [VERIFIED: AuthService.php:89-95]
```

Why it's good:
- References specific flow step
- Cites verified code
- Tests observable outcome (session record)

### Bad Test Candidate

```markdown
### Test: User receives welcome email after first login
- **Type**: Integration
- **Validates**: Welcome email sent to user
```

Why it's bad:
- No flow step reference
- No verification tag
- "First login" logic not in the traced flow (invented behavior)

---

## When to Use This Prompt

Use after you have:
1. Completed architecture overview (01)
2. Documented the code flow (02)
3. Want to plan test coverage systematically

Do NOT use:
- Without a verified code flow document
- To generate actual test code
- To invent tests for features not in the flow
