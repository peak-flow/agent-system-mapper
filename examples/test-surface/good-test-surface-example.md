# Test Surface: Create Booking Flow

> **This is an example of GOOD test surface documentation.**
> Every candidate is grounded in the verified Create Booking code flow for the
> mini Laravel app in `examples/laravel/slotbooker/` — including *absence* tests
> for behavior the bad example hallucinates (confirmation emails, BookingService).

## Metadata
| Field | Value |
|-------|-------|
| Flow Document | `examples/laravel/good-code-flow-doc-example.md` |
| Generated | `2026-08-03` |
| Flow Steps | 8 |
| Source Commit | `9a69c14` |

**Verify with:**
```bash
python3 verify.py examples/test-surface/good-test-surface-example.md --repo-root examples/laravel/slotbooker
```

---

## 1. Observable Outcomes

| Step | Outcome | Type | Evidence |
|------|---------|------|----------|
| Step 3 | Booking row created with status `'pending'` | Database Write | [VERIFIED: app/Http/Controllers/BookingController.php:49-54] |
| Step 3 | Full slot rejected: error flash, no booking row | HTTP Response | [VERIFIED: app/Http/Controllers/BookingController.php:43-46] |
| Step 4 | `BookingCreated` event dispatched (synchronously) | Event | [VERIFIED: app/Http/Controllers/BookingController.php:57] |
| Step 7 | HTTP POST to external calendar `/events` | External API Call | [VERIFIED: app/Services/CalendarService.php:30-33] |
| Step 8 | `external_calendar_id` persisted on successful sync | Database Write | [VERIFIED: app/Models/Booking.php:52-56] |
| Step 8 | Status updated to `'confirmed'` (unconditionally) | State Transition | [VERIFIED: app/Http/Controllers/BookingController.php:60] |
| Step 8 | Redirect to `booking.index` with success flash | HTTP Response | [VERIFIED: app/Http/Controllers/BookingController.php:62-63] |

---

## 2. Invariants

### Invariant 1: Booking ends `'confirmed'` after a successful store
- **Type**: State
- **Based on**: Steps 3, 8 of Code Flow
- **Evidence**: [VERIFIED: app/Http/Controllers/BookingController.php:49-54, 60]

### Invariant 2: `BookingCreated` fires exactly once per created booking
- **Type**: Cardinality
- **Based on**: Step 4 of Code Flow
- **Evidence**: [VERIFIED: app/Http/Controllers/BookingController.php:57] — single `event()` call, no loop

### Invariant 3: Event fires after the insert but before confirmation
- **Type**: Ordering
- **Based on**: Steps 3, 4, 8 of Code Flow
- **Evidence**: [VERIFIED: app/Http/Controllers/BookingController.php:49-60] — create at 49, event at 57, update at 60
- **Implication**: the listener (and external calendar) observe a `'pending'` booking. This is a documented wart — a test here pins current behavior, it does not bless it.

### Invariant 4: `markSynced` runs only when sync returned an id
- **Type**: Conditional
- **Based on**: Steps 6, 8 of Code Flow
- **Evidence**: [VERIFIED: app/Listeners/SyncToExternalCalendar.php:30-32] — guarded by `if ($externalId)`

### Invariant 5: Confirmation does NOT depend on sync success
- **Type**: Conditional (inverted expectation)
- **Based on**: Steps 7, 8 of Code Flow
- **Evidence**: [VERIFIED: app/Services/CalendarService.php:44-51] — API failure logged, `null` returned; [VERIFIED: app/Http/Controllers/BookingController.php:60] — update is unconditional
- **Implication**: tests must assert this current behavior knowingly and flag it for a product decision, not "fix" it silently.

---

## 3. Failure Modes

### Failure Mode 1: External calendar API returns non-2xx
- **Step**: Step 7
- **Cause**: API rejects the payload or is down (5xx)
- **Expected Behavior**: [VERIFIED: app/Services/CalendarService.php:44-51] — error logged, `null` returned, no retry, no exception
- **Downstream**: booking is still confirmed (Invariant 5); user believes they are booked but no calendar event exists
- **Risk**: High

### Failure Mode 2: HTTP transport exception (timeout, DNS)
- **Step**: Step 7
- **Cause**: connection-level failure
- **Expected Behavior**: [VERIFIED: app/Services/CalendarService.php:29-33] — the code's own comment says "no try/catch here - errors bubble up". [INFERRED] the exception propagates through the synchronous listener into the controller before line 60 runs, so the booking row exists but stays `'pending'` and the user gets an error page.
- **Risk**: High

### Failure Mode 3: Concurrent bookings on the last spot
- **Step**: Step 3
- **Cause**: two requests pass the capacity count before either is confirmed
- **Expected Behavior**: [NOT_FOUND: searched "lockForUpdate", "transaction", "unique(" in app/ and database/migrations/] — no locking, no transaction, no unique constraint. The migration's own comment flags the missing constraint [VERIFIED: database/migrations/2024_01_01_000003_create_bookings_table.php:27-28]
- **Risk**: High — overbooking is possible

### Failure Mode 4: Pending bookings are invisible to the capacity check
- **Step**: Step 3
- **Cause**: the check counts only `'confirmed'` bookings [VERIFIED: app/Http/Controllers/BookingController.php:43]
- **Expected Behavior**: [INFERRED] — a booking stuck at `'pending'` (see Failure Mode 2) never consumes capacity, widening the overbooking window
- **Risk**: Medium

### Failure Mode 5: Per-user booking limit not enforced
- **Step**: Step 3
- **Cause**: config defines a limit [VERIFIED: config/calendar.php:42] but [NOT_FOUND: searched "max_bookings_per_user" in app/] — nothing reads it
- **Risk**: Medium — one user can book unlimited slots

---

## 4. Test Candidates

### Test 1: Successful booking ends `'confirmed'` and fires the event once
- **Type**: Integration
- **Priority**: Critical
- **Validates**:
  - Booking row exists for the right user and slot
  - Final status is `'confirmed'`
  - `BookingCreated` dispatched exactly once
- **Based on**: Steps 3, 4, 8 of Code Flow
- **Preconditions**: authenticated user, slot with free capacity
- **Expected Outcome**: redirect with success flash; confirmed row in DB
- **Verification**: [VERIFIED: app/Http/Controllers/BookingController.php:49-63]

### Test 2: Full slot is rejected — no row, no event
- **Type**: Integration
- **Priority**: Critical
- **Validates**:
  - `back()` with error flash when confirmed count >= capacity
  - No booking row created, no event fired
- **Based on**: Step 3 of Code Flow (alternate exit)
- **Preconditions**: slot with capacity fully consumed by `'confirmed'` bookings
- **Expected Outcome**: error flash "This slot is no longer available"
- **Verification**: [VERIFIED: app/Http/Controllers/BookingController.php:43-46]

### Test 3: Calendar sync failure still confirms the booking (pin current behavior)
- **Type**: Integration
- **Priority**: Critical
- **Validates**:
  - When the external API responds non-2xx, `syncBooking` returns `null`
  - `external_calendar_id` stays null, yet status still becomes `'confirmed'`
- **Based on**: Steps 7, 8 of Code Flow; Failure Mode 1; Invariant 5
- **Preconditions**: external API stubbed to fail
- **Expected Outcome**: confirmed booking with no external id — the test documents the divergence
- **Verification**: [VERIFIED: app/Services/CalendarService.php:44-51, app/Http/Controllers/BookingController.php:60]

### Test 4: Successful sync persists `external_calendar_id`
- **Type**: Integration
- **Priority**: Important
- **Validates**:
  - Listener passes the booking to `CalendarService::syncBooking`
  - Returned id is stored via `markSynced`
- **Based on**: Steps 6, 8 of Code Flow
- **Preconditions**: external API stubbed to return an `id`
- **Expected Outcome**: booking row carries the external id
- **Verification**: [VERIFIED: app/Listeners/SyncToExternalCalendar.php:28-32, app/Models/Booking.php:52-56]

### Test 5: Sync payload has the documented shape
- **Type**: Unit
- **Priority**: Important
- **Validates**:
  - Payload contains `title`, `start`, `end`, `attendee_email`, `metadata.booking_id`, `metadata.source`
  - Timestamps use the hardcoded `Y-m-d\TH:i:s` format
- **Based on**: Step 7 of Code Flow
- **Preconditions**: booking with related user and time slot
- **Expected Outcome**: outgoing request body matches the built payload
- **Verification**: [VERIFIED: app/Services/CalendarService.php:86-95]

### Test 6: Listener observes status `'pending'` (ordering pin)
- **Type**: Integration
- **Priority**: Important
- **Validates**:
  - At handler time, the booking status is still `'pending'`
- **Based on**: Steps 3, 4, 8 of Code Flow; Invariant 3
- **Preconditions**: normal successful booking
- **Expected Outcome**: assertion inside a listener spy sees `'pending'`; flags the ordering wart if someone "fixes" it silently
- **Verification**: [VERIFIED: app/Http/Controllers/BookingController.php:52, 57, 60]

### Test 7: No confirmation email is sent (absence test)
- **Type**: Integration
- **Priority**: Important
- **Validates**:
  - The flow completes without dispatching any mailable or notification
- **Based on**: [NOT_FOUND: searched "mail", "Mail::", "Notification", "notify" in app/] — the flow has no email step
- **Preconditions**: normal successful booking
- **Expected Outcome**: zero mail/notification dispatches. A suite that asserts a `BookingConfirmation` mailable (as the bad example does) is testing hallucinated behavior.
- **Verification**: [VERIFIED: app/Http/Controllers/BookingController.php:37-64] — the full `store()` method contains no mail call

### Test 8: Concurrent last-spot requests (overbooking probe)
- **Type**: Integration
- **Priority**: Critical
- **Validates**:
  - Whether two near-simultaneous requests for a 1-capacity slot both succeed
- **Based on**: Failure Mode 3
- **Preconditions**: slot with capacity 1, two concurrent submissions
- **Expected Outcome**: with current code, both likely succeed (documents the defect); desired behavior — one rejected — requires the missing constraint
- **Verification**: [NOT_FOUND: searched "unique(" in database/migrations/] no guard exists; see migration comment at database/migrations/2024_01_01_000003_create_bookings_table.php:27-28

---

## 5. Priority Matrix

| Test Candidate | Impact | Likelihood | External | Priority |
|----------------|--------|------------|----------|----------|
| Test 1: Successful booking confirmed | 3 | 2 | 3 | 8 (Critical) |
| Test 3: Sync failure still confirms | 3 | 2 | 3 | 8 (Critical) |
| Test 8: Overbooking probe | 3 | 2 | 3 | 8 (Critical) |
| Test 2: Full slot rejected | 3 | 2 | 2 | 7 (Critical) |
| Test 4: External id persisted | 2 | 2 | 2 | 6 (Important) |
| Test 6: Listener sees `'pending'` | 2 | 2 | 1 | 5 (Important) |
| Test 5: Payload shape | 2 | 1 | 2 | 5 (Important) |
| Test 7: No email sent (absence) | 2 | 1 | 1 | 4 (Important) |

---

## 6. Test Gaps

| Gap | Reason | Recommendation |
|-----|--------|----------------|
| External HTTP isolation | `CalendarService` reads config in its constructor and calls the `Http` facade directly [VERIFIED: app/Services/CalendarService.php:18-19, 30-33] | Stub at the HTTP layer, or bind a test double through `CalendarServiceInterface` [VERIFIED: app/Providers/CalendarServiceProvider.php:19-22] |
| Retry/timeout behavior | `sync_timeout` and `retry_attempts` are defined but never read [VERIFIED: config/calendar.php:27-28] | Nothing to test until implemented — do not write tests for config that has no effect |
| Queue behavior | The listener runs synchronously; no jobs or queues exist in this flow [VERIFIED: app/Listeners/SyncToExternalCalendar.php:10] | Do not assert queued jobs; revisit if sync is ever made async |

---

## Verification Summary

| Status | Count |
|--------|-------|
| VERIFIED | 29 |
| INFERRED | 2 |
| NOT_FOUND | 4 |

---

## Why This Example is Good

1. **Every candidate cites real flow steps and real files** — the flow document exists and its citations were verified first.
2. **Absence tests come from `[NOT_FOUND]`** — no email, no queue, no booking limit. The bad example asserts a confirmation email; this doc proves that would test hallucinated behavior.
3. **Warts are pinned, not blessed** — sync-failure-still-confirms and the `'pending'` ordering are tested as *current* behavior and flagged for product decisions.
4. **Failure modes are grounded** — each one traces to a specific line or a documented search, not to generic "what if the server dies" speculation.
5. **Priorities are scored** — impact/likelihood/external, not vibes.
6. **No test code** — candidates only; framework and mocking strategy are left to the implementer.
7. **Machine-checkable** — the "Verify with" command exits 0 against the slotbooker source.
