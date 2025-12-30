# Test Surface: Create Booking Flow

> **WARNING: This is an example of BAD test surface documentation.**
> It demonstrates common anti-patterns that violate the methodology.

## Metadata
| Field | Value |
|-------|-------|
| Flow Document | (not specified) |
| Generated | `2025-01-15` |

---

## 1. Observable Outcomes

| Outcome | Type |
|---------|------|
| Booking is created | Database |
| Email is sent | Email |
| User is notified | Notification |
| Analytics event tracked | Analytics |
| Cache is invalidated | Cache |

**❌ PROBLEMS:**
- No flow step references
- No verification tags
- "Analytics event" and "Cache invalidation" — not in any traced flow (invented)
- "User is notified" — vague, what notification?

---

## 2. Invariants

### Invariant 1: Booking should work correctly
- The system should create a booking when the user submits valid data

### Invariant 2: Emails should be sent
- The user should receive a confirmation email after booking

### Invariant 3: The system should handle errors gracefully
- Any errors should be caught and logged appropriately

**❌ PROBLEMS:**
- No verification tags
- No code references
- "Should work correctly" — meaningless, not testable
- "Handle errors gracefully" — vague, no specific behavior
- These read like requirements, not verified invariants

---

## 3. Failure Modes

### Failure Mode 1: What if the database is down?
- The system should show an error message

### Failure Mode 2: What if the user's session expires?
- They should be redirected to login

### Failure Mode 3: What if there's a network timeout?
- The request should retry automatically

### Failure Mode 4: What if the payment fails?
- The booking should be cancelled and user refunded

### Failure Mode 5: What if the server runs out of memory?
- The system should gracefully degrade

**❌ PROBLEMS:**
- No verification tags — all invented
- "Payment fails" — no payment in the traced flow!
- "Session expires" — not a booking flow concern
- "Network timeout" / "Out of memory" — infrastructure, not code behavior
- These are imagined failure modes, not derived from actual code

---

## 4. Test Candidates

### Test 1: User can create a booking
```php
public function test_user_can_create_booking()
{
    $user = User::factory()->create();
    $slot = TimeSlot::factory()->available()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/bookings', ['slot_id' => $slot->id]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('bookings', ['user_id' => $user->id]);
}
```

### Test 2: User receives confirmation email
```php
public function test_user_receives_confirmation_email()
{
    Mail::fake();
    // ... create booking
    Mail::assertSent(BookingConfirmation::class);
}
```

### Test 3: Booking fails for unavailable slot
```php
public function test_booking_fails_for_unavailable_slot()
{
    // ... test code
}
```

**❌ PROBLEMS:**
- **CRITICAL: Contains actual test code** — this prompt should NOT generate code
- No flow step references
- No verification tags
- Test 2 assumes `BookingConfirmation` mailable exists — not verified
- Framework-specific code (Laravel) — prompt should be framework-agnostic

---

## 5. Additional Test Ideas

- Test that admin can override bookings
- Test that users can cancel within 24 hours
- Test that premium users get priority
- Test that waitlist is updated when slot opens
- Test OAuth login flow
- Test password reset
- Test user profile updates

**❌ PROBLEMS:**
- **CRITICAL: These features are not in the traced flow** — invented behavior
- "Admin override", "premium users", "waitlist" — never mentioned in code flow
- "OAuth", "password reset", "profile updates" — completely different flows
- This is speculation about what the system *might* do

---

## 6. Edge Cases to Consider

- Empty string for slot_id
- Negative slot_id
- Slot_id with SQL injection
- Very long slot_id
- Unicode characters in slot_id
- Booking in the past
- Booking 10 years in the future
- User with 1000 existing bookings
- Slot that's been soft-deleted
- Concurrent requests from same user

**❌ PROBLEMS:**
- No verification that any of these are handled
- "SQL injection" — assumes ORM doesn't protect (it does)
- "10 years in the future" — is there actually a date limit? Unknown
- "1000 existing bookings" — is there a limit? [NOT_FOUND] but not marked
- These are generic edge cases, not derived from the specific flow

---

## 7. Test Priority

1. Happy path - Most important!
2. Sad path - Also important
3. Edge cases - Nice to have
4. Performance - Later

**❌ PROBLEMS:**
- No scoring criteria
- No specific tests listed
- "Happy path" vs "Sad path" — vague categories
- No impact/likelihood/external analysis

---

## Why This Example is Bad

| Anti-Pattern | Example in This Doc |
|--------------|---------------------|
| **No verification tags** | Every section lacks `[VERIFIED: file:line]` |
| **No flow step references** | Test candidates don't cite "Step N of Flow" |
| **Invented behavior** | "Analytics tracking", "Premium users", "Waitlist" |
| **Contains test code** | PHPUnit code in Test Candidates section |
| **Framework-specific** | Laravel facades, factories in examples |
| **Generic edge cases** | SQL injection, unicode — not flow-specific |
| **Vague invariants** | "Should work correctly", "Handle gracefully" |
| **Ungrounded failure modes** | "Database down", "Out of memory" |
| **Missing metadata** | No flow document reference, no commit hash |

---

## How to Fix This

1. **Start with the Code Flow document** — read it first
2. **Cite every claim** — `[VERIFIED: file:line]` or `[NOT_FOUND]`
3. **Reference flow steps** — "Based on Step 3 of Code Flow"
4. **No test code** — only test candidates (descriptions)
5. **Only test traced behavior** — if it's not in the flow, don't test it
6. **Be specific** — "status='confirmed'" not "works correctly"
