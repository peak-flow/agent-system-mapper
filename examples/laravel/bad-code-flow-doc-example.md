# Create Booking Code Flow (SlotBooker)

> ⚠️ **BAD EXAMPLE — DO NOT IMITATE.** This document demonstrates hallucination patterns. Each ❌ callout explains a failure. See the good example for the correct approach.

## Metadata
| Field | Value |
|-------|-------|
| Repository | `slotbooker` |
| Documented | `2026-08-03` |

> **❌ PROBLEMS:** No commit hash, no trigger, no end state, and no "Verify with:" command — nothing ties this document to a code state, so nobody can check it. The good example pins commit `9a69c14` and ships a runnable `verify.py` command. Running the verifier on THIS document reports zero checkable citations and fails: unverifiable docs fail by default.

---

## The Booking Flow

1. The user submits the booking form, which is validated client-side and then by the `StoreBookingRequest` form request class.
2. `BookingController::store()` passes the validated data to `BookingService::createBooking()`.
3. `BookingService` re-checks availability with `TimeSlot::hasAvailability()` inside a database transaction, locking the slot row with `lockForUpdate()`.
4. The booking is saved with status `confirmed`.
5. A `BookingConfirmationMail` is queued and emailed to the user.
6. An SMS reminder is scheduled via Twilio for 24 hours before the slot.
7. A `SyncBookingToCalendarJob` is pushed onto the `calendar` queue and retried up to 3 times using the `retry_attempts` config value.
8. The user is shown the confirmation page with a link to the synced calendar event.

> **❌ PROBLEMS:** Not one step has a `file:line` citation or a quoted line of code, and most of them are fiction:
> - **Step 1** — there is no `StoreBookingRequest` and no validation at all: the controller reads raw input at `app/Http/Controllers/BookingController.php:39` and `:53`, and its own comment at `:48` says "no validation on notes field, could be XSS".
> - **Step 2** — `BookingService` does not exist. The only service is `app/Services/CalendarService.php`; booking logic is inline in `BookingController::store()` at `app/Http/Controllers/BookingController.php:37-64`.
> - **Step 3** — no transaction, no `lockForUpdate()`. The capacity check is a plain count at `app/Http/Controllers/BookingController.php:43-46`, duplicating `TimeSlot::hasAvailability()` (`app/Models/TimeSlot.php:31-42`) — the controller's own comment at `app/Http/Controllers/BookingController.php:42` even flags the duplication.
> - **Step 4** — the booking is created with status `'pending'` at `app/Http/Controllers/BookingController.php:52` and only flipped to `'confirmed'` at `:60`, *after* the event fires at `:57`. "Saved with status confirmed" hides a real ordering wart.
> - **Steps 5-6** — pure hallucination. There is no mail, no `BookingConfirmationMail`, no SMS, no Twilio anywhere under `app/`. The plausible-sounding notification steps are exactly what an agent invents when it documents from convention instead of code.
> - **Step 7** — there are no jobs and no queues. Sync happens in a synchronous event listener (`app/Providers/CalendarServiceProvider.php:34`, `app/Listeners/SyncToExternalCalendar.php:22-34`), and `retry_attempts` is defined at `config/calendar.php:28` but never read — the config file's own comment at `:22-23` says so.
> - **Step 8** — there is no confirmation page and no calendar link. The controller redirects back to `booking.index` with a flash message at `app/Http/Controllers/BookingController.php:62-63`.

---

## Error Handling

If the calendar sync fails, the job is retried automatically and the user is notified by email that their booking could not be synced. All errors are handled gracefully.

> **❌ PROBLEMS:** The opposite of the real behavior. `CalendarService::syncBooking()` has no try/catch — the comment at `app/Services/CalendarService.php:29` says "no try/catch here - errors bubble up" — and on an API failure it just logs and returns `null` (`app/Services/CalendarService.php:44-51`). The caller then confirms the booking anyway (`app/Http/Controllers/BookingController.php:60`), so a failed sync is silent: no retry, no notification, and the user sees "Booking confirmed!". "Handled gracefully" is an unverifiable comfort phrase, not a finding.

---

## Why This Example is BAD

1. **"Validated by `StoreBookingRequest`"** → no validation exists; raw `$request->input()` at `app/Http/Controllers/BookingController.php:39`, `:53`, with the XSS wart noted at `:48`.
2. **"`BookingService::createBooking()`"** → `BookingService` does not exist; the logic is inline in `app/Http/Controllers/BookingController.php:37-64`. This is the exact hallucination the architecture bad example warns about.
3. **"Transaction with `lockForUpdate()`"** → no transaction or lock anywhere; just a count at `app/Http/Controllers/BookingController.php:43-46`, and the bookings migration comment at `database/migrations/2024_01_01_000003_create_bookings_table.php:27-28` flags the missing unique constraint the lock story papers over.
4. **"Saved with status `confirmed`"** → created `'pending'` (`app/Http/Controllers/BookingController.php:52`), event fired at `:57`, then updated to `'confirmed'` at `:60`. The invented version erases a real bug surface.
5. **"Confirmation email queued"** → no mail code exists anywhere in `app/` — a real trace records this as a NOT_FOUND, like the good example does.
6. **"SMS via Twilio"** → no SMS integration exists anywhere in `app/`.
7. **"`SyncBookingToCalendarJob` on the `calendar` queue, 3 retries"** → sync is a synchronous listener (`app/Listeners/SyncToExternalCalendar.php:22-34`) registered via `Event::subscribe` (`app/Providers/CalendarServiceProvider.php:34`); `retry_attempts` (`config/calendar.php:28`) is dead config that nothing reads.
8. **"Confirmation page with calendar link"** → a redirect with a flash message (`app/Http/Controllers/BookingController.php:62-63`); the view never shows any calendar link.
9. **"Errors handled gracefully"** → errors bubble up uncaught (`app/Services/CalendarService.php:29`) or are logged and swallowed (`app/Services/CalendarService.php:44-51`) while the booking is confirmed regardless.
10. **No citations, no quotes, no tags, no commit** → nothing in this document can be checked. Every numbered step *sounds* right for a Laravel booking app, which is precisely why uncited flow docs are dangerous: a reader cannot tell steps 1-3 (plausible fiction) from steps 5-7 (pure invention).
