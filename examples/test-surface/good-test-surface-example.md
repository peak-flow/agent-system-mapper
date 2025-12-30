# Test Surface: Create Booking Flow

> **This is an example of GOOD test surface documentation.**
> It demonstrates proper grounding in verified code flows.

## Metadata
| Field | Value |
|-------|-------|
| Flow Document | `pf-docs/02-code-flow-create-booking.md` |
| Generated | `2025-01-15` |
| Flow Steps | 7 |
| Source Commit | `e043013` |

---

## 1. Observable Outcomes

| Step | Outcome | Type | Evidence |
|------|---------|------|----------|
| Step 2 | Request validated | Validation | [VERIFIED: BookingController.php:34] |
| Step 3 | Booking record created | Database Write | [VERIFIED: BookingService.php:45] |
| Step 4 | TimeSlot marked unavailable | Database Write | [VERIFIED: BookingService.php:48] |
| Step 5 | BookingCreated event dispatched | Event | [VERIFIED: BookingService.php:52] |
| Step 6 | Confirmation email queued | Queue Job | [VERIFIED: Listeners/SendBookingConfirmation.php:18] |
| Step 7 | 201 Created response returned | HTTP Response | [VERIFIED: BookingController.php:67] |

---

## 2. Invariants

### Invariant 1: Booking and TimeSlot updates are atomic
- **Type**: Data Integrity
- **Based on**: Step 3, Step 4 of Code Flow
- **Evidence**: [VERIFIED: BookingService.php:42-50] — wrapped in `DB::transaction()`
- **Implication**: If booking fails, slot must remain available

### Invariant 2: BookingCreated event fires exactly once per booking
- **Type**: Cardinality
- **Based on**: Step 5 of Code Flow
- **Evidence**: [VERIFIED: BookingService.php:52] — single `event()` call, no loop
- **Implication**: Duplicate events would trigger duplicate emails

### Invariant 3: Confirmation email only sends for confirmed bookings
- **Type**: Conditional
- **Based on**: Step 5, Step 6 of Code Flow
- **Evidence**: [VERIFIED: Listeners/SendBookingConfirmation.php:15] — checks `$booking->status === 'confirmed'`
- **Implication**: Pending/cancelled bookings must not trigger email

### Invariant 4: Response includes booking ID and confirmation URL
- **Type**: Data Integrity
- **Based on**: Step 7 of Code Flow
- **Evidence**: [VERIFIED: BookingController.php:65-67] — returns `BookingResource`
- **Implication**: Client needs ID for subsequent operations

---

## 3. Failure Modes

### Failure Mode 1: TimeSlot already booked (race condition)
- **Step**: Step 3, Step 4
- **Cause**: Concurrent request books same slot
- **Expected Behavior**: [VERIFIED: BookingService.php:44] — `lockForUpdate()` on TimeSlot
- **Risk**: Low — pessimistic locking prevents race
- **Test Priority**: Medium — verify lock behavior

### Failure Mode 2: User exceeds booking limit
- **Step**: Step 2
- **Cause**: User already has max bookings for period
- **Expected Behavior**: [NOT_FOUND] — no booking limit check in traced flow
- **Risk**: High — could allow unlimited bookings
- **Recommendation**: Verify business rule exists elsewhere or add

### Failure Mode 3: Email service unavailable
- **Step**: Step 6
- **Cause**: SMTP server down or rate limited
- **Expected Behavior**: [VERIFIED: Listeners/SendBookingConfirmation.php:22] — exception caught, logged
- **Risk**: Low — booking succeeds, email fails gracefully
- **Test Priority**: Low — failure is acceptable

### Failure Mode 4: Transaction rollback on exception
- **Step**: Step 3-4
- **Cause**: Any exception within transaction
- **Expected Behavior**: [VERIFIED: BookingService.php:42] — `DB::transaction()` auto-rollback
- **Risk**: Low — Laravel handles this
- **Test Priority**: Medium — verify no partial state

---

## 4. Test Candidates

### Test 1: Successful booking creates confirmed record
- **Type**: Integration
- **Priority**: Critical
- **Validates**:
  - Booking record exists in database
  - Status is 'confirmed'
  - Associated with correct user and time slot
- **Based on**: Steps 3, 7 of Code Flow
- **Preconditions**: Valid user, available time slot
- **Expected Outcome**: 201 response, booking in DB with status='confirmed'
- **Verification**: [VERIFIED: BookingService.php:45-50]

### Test 2: Booking marks time slot as unavailable
- **Type**: Integration
- **Priority**: Critical
- **Validates**:
  - TimeSlot.is_available changes from true to false
  - Change is atomic with booking creation
- **Based on**: Steps 3, 4 of Code Flow
- **Preconditions**: Slot was available before request
- **Expected Outcome**: Slot no longer available for other bookings
- **Verification**: [VERIFIED: BookingService.php:48]

### Test 3: BookingCreated event contains correct payload
- **Type**: Unit
- **Priority**: Important
- **Validates**:
  - Event has booking_id property
  - Event has user_id property
  - Event has slot_id property
- **Based on**: Step 5 of Code Flow
- **Preconditions**: Successful booking
- **Expected Outcome**: Event payload matches booking data
- **Verification**: [VERIFIED: Events/BookingCreated.php:12-18]

### Test 4: Confirmation email listener responds to event
- **Type**: Integration
- **Priority**: Important
- **Validates**:
  - Listener is registered for BookingCreated
  - Email job is dispatched to queue
- **Based on**: Steps 5, 6 of Code Flow
- **Preconditions**: Event dispatched
- **Expected Outcome**: Job exists in queue with correct booking_id
- **Verification**: [VERIFIED: EventServiceProvider.php:22, Listeners/SendBookingConfirmation.php:18]

### Test 5: Concurrent booking requests don't double-book slot
- **Type**: Integration
- **Priority**: Critical
- **Validates**:
  - Second request fails with 409 or 422
  - Only one booking exists for slot
- **Based on**: Failure Mode 1
- **Preconditions**: Two simultaneous requests for same slot
- **Expected Outcome**: One succeeds, one fails, no duplicate
- **Verification**: [VERIFIED: BookingService.php:44] — `lockForUpdate()`

### Test 6: Invalid time slot ID returns 422
- **Type**: Unit
- **Priority**: Important
- **Validates**:
  - Request validation rejects non-existent slot
  - No booking created
  - Error message indicates invalid slot
- **Based on**: Step 2 of Code Flow
- **Preconditions**: Request with invalid slot_id
- **Expected Outcome**: 422 with validation error
- **Verification**: [VERIFIED: BookingController.php:34] — `exists:time_slots,id` rule

---

## 5. Priority Matrix

| Test Candidate | Impact | Likelihood | External | Priority |
|----------------|--------|------------|----------|----------|
| Test 1: Successful booking | 3 | 2 | 3 | 8 (Critical) |
| Test 2: Slot marked unavailable | 3 | 2 | 3 | 8 (Critical) |
| Test 5: No double-booking | 3 | 2 | 3 | 8 (Critical) |
| Test 4: Email listener works | 2 | 1 | 2 | 5 (Important) |
| Test 3: Event payload correct | 2 | 1 | 1 | 4 (Important) |
| Test 6: Invalid slot rejected | 2 | 1 | 1 | 4 (Important) |

---

## 6. Test Gaps

| Gap | Reason | Recommendation |
|-----|--------|----------------|
| Booking limit per user | [NOT_FOUND] in flow | Verify rule exists or add to requirements |
| Cancellation refund logic | Not in this flow | Document separate "Cancel Booking" flow first |
| Admin override booking | Not in this flow | Document admin flow separately |

---

## Verification Summary

| Status | Count |
|--------|-------|
| VERIFIED | 14 |
| INFERRED | 0 |
| NOT_FOUND | 1 |

---

## Why This Example is Good

1. **Every test candidate cites flow steps** — no invented behavior
2. **Verification tags on all claims** — `[VERIFIED: file:line]`
3. **Failure modes are grounded** — derived from actual code patterns
4. **NOT_FOUND items are flagged** — booking limit gap is explicit
5. **Priority is justified** — scoring based on impact/likelihood/external
6. **No test code** — candidates only, implementation left to developer
