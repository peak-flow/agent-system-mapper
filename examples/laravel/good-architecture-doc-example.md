# SlotBooker Architecture Overview

> **This is an example of GOOD architecture documentation.**
> Every citation resolves against the mini Laravel app in `examples/laravel/slotbooker/`,
> so this example is machine-verifiable wherever the mapper is installed.

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/laravel/slotbooker` |
| Commit | `9a69c14` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

**Verify with:**
```bash
python3 verify.py examples/laravel/good-architecture-doc-example.md --repo-root examples/laravel/slotbooker
```

## Verification Summary
- `[VERIFIED]`: 91 tags — 133/133 citations resolve; 8/8 quoted blocks match their source
- `[INFERRED]`: 2 tags
- `[NOT_FOUND]`: 7 items (BookingService, email, SMS, unused config reads, framework manifest)
- `[ASSUMED]`: 2 items (Laravel conventions)

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | Framework backend (Laravel-style MVC with events/listeners) |
| Evidence | Eloquent models extend `Illuminate\Database\Eloquent\Model` [VERIFIED: app/Models/Booking.php:5-7]; routes use the `Route` facade [VERIFIED: routes/web.php:4]; events wired via `Event::subscribe` [VERIFIED: app/Providers/CalendarServiceProvider.php:34] |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` for the code patterns; [NOT_FOUND: no composer.json or artisan in examples/laravel/slotbooker/ — the example app ships application code only, so the framework version cannot be pinned] |

---

## 1. System Purpose

SlotBooker is a small booking system: users view available time slots, create bookings, cancel bookings, and the system syncs each booking to an external calendar API through an event listener.

The system exposes four routes [VERIFIED: routes/web.php:17-30]:
- `GET /booking` — view available slots and the user's bookings
- `POST /booking` — create a booking
- `POST /booking/{booking}/cancel` — cancel a booking
- `GET /api/slots/availability` — AJAX availability check

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| BookingController | `app/Http/Controllers/BookingController.php` | HTTP handling for all four routes: `index`, `store`, `cancel`, `checkAvailability` | [VERIFIED: app/Http/Controllers/BookingController.php:16, 37, 70, 95] |
| User model | `app/Models/User.php` | User entity; `hasMany` bookings | [VERIFIED: app/Models/User.php:7, 14-17] |
| Booking model | `app/Models/Booking.php` | Booking entity; status constants; cancellation rule; sync marker | [VERIFIED: app/Models/Booking.php:7, 18-20, 36-47, 52-56] |
| TimeSlot model | `app/Models/TimeSlot.php` | Slot entity; availability and capacity logic | [VERIFIED: app/Models/TimeSlot.php:7, 31-42] |
| Migrations | `database/migrations/` | Schema for `users`, `time_slots`, `bookings` (3 tables) | [VERIFIED: database/migrations/2024_01_01_000001_create_users_table.php:14, database/migrations/2024_01_01_000003_create_bookings_table.php:14] |
| CalendarService | `app/Services/CalendarService.php` | External calendar API integration (`syncBooking`, `removeBooking`) | [VERIFIED: app/Services/CalendarService.php:25, 57] |
| CalendarServiceInterface | `app/Contracts/CalendarServiceInterface.php` | Service abstraction bound in the provider | [VERIFIED: app/Contracts/CalendarServiceInterface.php:7, 15, 23] |
| Events | `app/Events/` | `BookingCreated`, `BookingCancelled` domain events wrapping a Booking | [VERIFIED: app/Events/BookingCreated.php:9, app/Events/BookingCancelled.php:9] |
| SyncToExternalCalendar | `app/Listeners/SyncToExternalCalendar.php` | Event subscriber; calls CalendarService on create/cancel | [VERIFIED: app/Listeners/SyncToExternalCalendar.php:22, 39, 59-65] |
| CalendarServiceProvider | `app/Providers/CalendarServiceProvider.php` | Binds interface to implementation; registers the event subscriber | [VERIFIED: app/Providers/CalendarServiceProvider.php:19-22, 34] |
| Config | `config/calendar.php` | External API settings plus (unused) sync and booking-rule settings | [VERIFIED: config/calendar.php:14-15, 27-28, 41-42] |
| Blade view | `resources/views/booking.blade.php` | Booking page UI: slot cards, user bookings, cancel modal | [VERIFIED: resources/views/booking.blade.php:19, 47, 77] |
| JavaScript | `public/js/booking.js` | Availability AJAX, cancel modal wiring, 30-second polling | [VERIFIED: public/js/booking.js:17-27, 57-65, 94-98] |

[NOT_FOUND: searched "BookingService", "NotificationService" in app/] No dedicated BookingService exists — booking logic lives directly in `BookingController::store` and `BookingController::cancel`.

### Core Data Models

#### `User` — app/Models/User.php

[VERIFIED: app/Models/User.php:9]
```php
    protected $fillable = ['name', 'email', 'phone'];
```

Relationships:
- `bookings()` → `hasMany(Booking::class)` [VERIFIED: app/Models/User.php:14-17]
- `activeBookings()` filters on the string literal `'confirmed'` instead of the constant [VERIFIED: app/Models/User.php:23-26]

#### `Booking` — app/Models/Booking.php

[VERIFIED: app/Models/Booking.php:9-15]
```php
    protected $fillable = [
        'user_id',
        'time_slot_id',
        'status',
        'notes',
        'external_calendar_id',  // stored after sync
    ];
```

Status constants [VERIFIED: app/Models/Booking.php:18-20]:
```php
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CANCELLED = 'cancelled';
```

[INFERRED] The constants exist but several call sites use raw string literals instead — see §6 Known Issues & Risks.

Relationships and business rules:
- `user()` → `belongsTo(User::class)` [VERIFIED: app/Models/Booking.php:22-25]
- `timeSlot()` → `belongsTo(TimeSlot::class)` [VERIFIED: app/Models/Booking.php:27-30]
- `canCancel()` — blocks cancellation within 24 hours of the slot; the `24` is hardcoded [VERIFIED: app/Models/Booking.php:36-47]
- `markSynced($externalId)` — stores the external calendar id after a successful sync [VERIFIED: app/Models/Booking.php:52-56]

#### `TimeSlot` — app/Models/TimeSlot.php

[VERIFIED: app/Models/TimeSlot.php:9-14]
```php
    protected $fillable = [
        'start_time',
        'end_time',
        'capacity',
        'is_available',
    ];
```

Relationships and helpers:
- `bookings()` → `hasMany(Booking::class)` [VERIFIED: app/Models/TimeSlot.php:22-25]
- `hasAvailability()` — capacity check counting `'confirmed'` bookings [VERIFIED: app/Models/TimeSlot.php:31-42]
- `spotsLeft()` — remaining capacity for display [VERIFIED: app/Models/TimeSlot.php:47-51]
- `scopeAvailableFuture()` — future, available slots [VERIFIED: app/Models/TimeSlot.php:56-61]

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

This section identifies **where execution enters the system** and **which components participate**. Step-by-step tracing is deliberately deferred to the Code Flow documentation (`02-code-flows.md`; the create-booking flow is traced in `good-code-flow-doc-example.md`).

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|--------------|------|-----------------------------|----------|
| `GET /booking` | Web Route | BookingController::index, TimeSlot (scope), booking.blade.php | [VERIFIED: routes/web.php:17-18, app/Http/Controllers/BookingController.php:16-31] |
| `POST /booking` | Web Route (form submit) | BookingController::store, Booking, BookingCreated event | [VERIFIED: routes/web.php:21-22, app/Http/Controllers/BookingController.php:37-64] |
| `POST /booking/{booking}/cancel` | Web Route (form submit via JS modal) | BookingController::cancel, Booking::canCancel, BookingCancelled event | [VERIFIED: routes/web.php:25-26, app/Http/Controllers/BookingController.php:70-89] |
| `GET /api/slots/availability` | JSON API (AJAX) | BookingController::checkAvailability, TimeSlot | [VERIFIED: routes/web.php:29-30, app/Http/Controllers/BookingController.php:95-109] |
| `BookingCreated` / `BookingCancelled` events | Event | SyncToExternalCalendar subscriber, CalendarService | [VERIFIED: app/Providers/CalendarServiceProvider.php:34, app/Listeners/SyncToExternalCalendar.php:59-65] |

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input Type | Output Type | Participating Components |
|------|------------|-------------|--------------------------|
| Booking request handling | HTTP form POST (`time_slot_id`, `notes`) | Booking record (status `pending`, then `confirmed`) | BookingController, Booking [VERIFIED: app/Http/Controllers/BookingController.php:39, 49-54, 60] |
| Event dispatch | Booking record | Event payload carrying the Booking | BookingController, BookingCreated/BookingCancelled [VERIFIED: app/Http/Controllers/BookingController.php:57, 85] |
| Calendar sync | Booking (+ related TimeSlot, User) | HTTP POST/DELETE to external API; `external_calendar_id` stored | SyncToExternalCalendar, CalendarService, Booking [VERIFIED: app/Services/CalendarService.php:30-33, 63-65, app/Models/Booking.php:52-56] |
| Availability read | `slot_id` query param | JSON (`available`, `spots_left`, `start_time`) | BookingController, TimeSlot [VERIFIED: app/Http/Controllers/BookingController.php:104-108] |
| Page render | Slots + user bookings | HTML (Blade) | BookingController, booking.blade.php [VERIFIED: app/Http/Controllers/BookingController.php:27-30] |

### 3.3 Pointers to Code Flow Documentation

Candidates for detailed flow tracing (see `02-code-flows.md`):

- **Create Booking** — form submit → `BookingController::store` → `BookingCreated` → `SyncToExternalCalendar::handleCreated` → external POST (traced in `good-code-flow-doc-example.md`)
- **Cancel Booking** — modal form → `BookingController::cancel` → `BookingCancelled` → `SyncToExternalCalendar::handleCancelled` → external DELETE
- **Availability Check** — `booking.js` fetch → `BookingController::checkAvailability` → JSON response

### Section 3 Self-Check
- [x] No method bodies quoted; no loops or conditionals described
- [x] Movements described as conceptual stages, not steps
- [x] Detailed tracing deferred to `02-code-flows.md`

---

## 3b. Frontend → Backend Interaction Map

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|
| `resources/views/booking.blade.php` | form submit (`POST /booking`) | BookingController | `store()` | [VERIFIED: resources/views/booking.blade.php:33-38, routes/web.php:21-22] |
| `resources/views/booking.blade.php` | form submit (cancel modal; action set by JS) | BookingController | `cancel()` | [VERIFIED: resources/views/booking.blade.php:80-84, public/js/booking.js:62] |
| `resources/views/booking.blade.php` | inline `onclick` | `public/js/booking.js` | `confirmCancel(bookingId)` | [VERIFIED: resources/views/booking.blade.php:63, public/js/booking.js:57-65] |
| `public/js/booking.js` | `fetch()` request | BookingController | `checkAvailability()` | [VERIFIED: public/js/booking.js:19, routes/web.php:29-30] |
| `public/js/booking.js` | 30-second polling (`setInterval`) | BookingController | `checkAvailability()` per slot card | [VERIFIED: public/js/booking.js:94-98, app/Http/Controllers/BookingController.php:95] |

---

## 4. File/Folder Conventions

| Pattern | Location | Example |
|---------|----------|---------|
| Models | `app/Models/` | `User.php`, `Booking.php`, `TimeSlot.php` [VERIFIED: app/Models/Booking.php:3] |
| Controllers | `app/Http/Controllers/` | `BookingController.php` [VERIFIED: app/Http/Controllers/BookingController.php:3] |
| Services | `app/Services/` | `CalendarService.php` [VERIFIED: app/Services/CalendarService.php:3] |
| Contracts | `app/Contracts/` | `CalendarServiceInterface.php` [VERIFIED: app/Contracts/CalendarServiceInterface.php:3] |
| Events | `app/Events/` | `BookingCreated.php`, `BookingCancelled.php` [VERIFIED: app/Events/BookingCreated.php:3] |
| Listeners | `app/Listeners/` | `SyncToExternalCalendar.php` [VERIFIED: app/Listeners/SyncToExternalCalendar.php:3] |
| Providers | `app/Providers/` | `CalendarServiceProvider.php` [VERIFIED: app/Providers/CalendarServiceProvider.php:3] |
| Views | `resources/views/` | `booking.blade.php` [VERIFIED: resources/views/booking.blade.php:1] |
| JS | `public/js/` | `booking.js` [VERIFIED: public/js/booking.js:1] |
| Config | `config/` | `calendar.php` [VERIFIED: config/calendar.php:1] |
| Migrations | `database/migrations/` | 3 `create_*_table.php` files [VERIFIED: database/migrations/2024_01_01_000002_create_time_slots_table.php:1] |

[ASSUMED: Laravel convention] Web routes live in `routes/web.php`; the file's own header comment says auth middleware is assumed to be applied globally rather than attached per-route [VERIFIED: routes/web.php:11-12].

---

## 5. External Dependencies

### External Calendar API

The only external dependency is a calendar HTTP API, configured in `config/calendar.php` and called from `CalendarService` via the `Http` facade [VERIFIED: app/Services/CalendarService.php:7, 30-33].

[VERIFIED: config/calendar.php:14-15]
```php
    'api_url' => env('CALENDAR_API_URL', 'https://api.example-calendar.com/v1'),
    'api_key' => env('CALENDAR_API_KEY'),
```

Call sites:
- `POST {api_url}/events` — booking sync [VERIFIED: app/Services/CalendarService.php:30-33]
- `DELETE {api_url}/events/{external_calendar_id}` — booking removal [VERIFIED: app/Services/CalendarService.php:63-65]

Environment variables required: `CALENDAR_API_URL`, `CALENDAR_API_KEY` [VERIFIED: config/calendar.php:14-15].

[NOT_FOUND: searched "mail", "Mail::", "Notification" in app/] No email integration.
[NOT_FOUND: searched "sms", "twilio", "nexmo", "vonage" in app/] No SMS integration.

---

## 6. Known Issues & Risks

### Duplicated 24-hour cancellation rule

The 24-hour rule lives in three places, one of which is dead config:
- `Booking::canCancel()` hardcodes `>= 24` [VERIFIED: app/Models/Booking.php:46]
- `booking.js` hardcodes `CANCEL_HOURS_BEFORE = 24` [VERIFIED: public/js/booking.js:11]
- `config/calendar.php` defines `'cancel_hours_before' => 24` but nothing reads it [VERIFIED: config/calendar.php:41]

### Duplicated capacity check

- `TimeSlot::hasAvailability()` implements the capacity rule [VERIFIED: app/Models/TimeSlot.php:31-42]
- The controller re-implements the same count inline; the file's own comment flags the duplication [VERIFIED: app/Http/Controllers/BookingController.php:42-44]

### Missing error handling on calendar sync

[VERIFIED: app/Services/CalendarService.php:29-33]
```php
        // NOTE: no try/catch here - errors bubble up
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl . '/events', $payload);
```
HTTP transport failures propagate uncaught; API-level failures are logged and swallowed (`return null`) with no retry and no user-visible surfacing [VERIFIED: app/Services/CalendarService.php:44-51].

### Event fired before status is final

`BookingCreated` fires while the booking still has status `'pending'`; the controller flips it to `'confirmed'` only afterwards, regardless of sync outcome [VERIFIED: app/Http/Controllers/BookingController.php:57, 60].

### Unused configuration

[VERIFIED: config/calendar.php:27-28]
```php
    'sync_timeout' => env('CALENDAR_SYNC_TIMEOUT', 30),
    'retry_attempts' => env('CALENDAR_RETRY_ATTEMPTS', 3),
```
[NOT_FOUND: searched "sync_timeout", "retry_attempts" in app/] Defined but never read.
[NOT_FOUND: searched "max_bookings_per_user" in app/] `'max_bookings_per_user' => 5` is defined at config/calendar.php:42 but not enforced anywhere.

### Unvalidated notes field (potential XSS)

[VERIFIED: app/Http/Controllers/BookingController.php:53]
```php
            'notes' => $request->input('notes'),
```
No validation or sanitization; stored raw. [INFERRED] If `notes` is ever rendered unescaped, XSS is possible — the current Blade view does not render it at all.

### Status constants vs. string literals

Constants are defined [VERIFIED: app/Models/Booking.php:18-20] but raw strings are used at:
- `'status' => 'pending'` in `store()` [VERIFIED: app/Http/Controllers/BookingController.php:52]
- `where('status', 'confirmed')` in the capacity checks [VERIFIED: app/Http/Controllers/BookingController.php:43, app/Models/TimeSlot.php:38]
- `where('status', 'confirmed')` in `User::activeBookings()` [VERIFIED: app/Models/User.php:25]
- `$this->status === 'cancelled'` in `canCancel()` [VERIFIED: app/Models/Booking.php:38]

### No double-booking guard

The bookings migration has no unique constraint on (`user_id`, `time_slot_id`); the migration's own comment flags the gap [VERIFIED: database/migrations/2024_01_01_000003_create_bookings_table.php:27-28].

---

## 7. Entry Points Summary

| Route/Entry | Method | Handler | Middleware | Verified |
|-------------|--------|---------|------------|----------|
| `/booking` | GET | `BookingController@index` | none attached here | [VERIFIED: routes/web.php:17-18] |
| `/booking` | POST | `BookingController@store` | none attached here | [VERIFIED: routes/web.php:21-22] |
| `/booking/{booking}/cancel` | POST | `BookingController@cancel` | none attached here | [VERIFIED: routes/web.php:25-26] |
| `/api/slots/availability` | GET | `BookingController@checkAvailability` | none attached here | [VERIFIED: routes/web.php:29-30] |
| `BookingCreated` event | Event | `SyncToExternalCalendar::handleCreated` | — | [VERIFIED: app/Listeners/SyncToExternalCalendar.php:62] |
| `BookingCancelled` event | Event | `SyncToExternalCalendar::handleCancelled` | — | [VERIFIED: app/Listeners/SyncToExternalCalendar.php:63] |

[ASSUMED: Laravel convention] The routes file comment says auth middleware is applied globally in `RouteServiceProvider`, but no middleware is attached in `routes/web.php` itself [VERIFIED: routes/web.php:11-12].

---

## 8. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| Backend Framework | Laravel-style (Eloquent models, Blade views, `Illuminate\*` facades) | [VERIFIED: app/Http/Controllers/BookingController.php:9, app/Models/Booking.php:5] |
| Frontend | Server-rendered Blade + vanilla JavaScript | [VERIFIED: resources/views/booking.blade.php:89, public/js/booking.js:1] |
| Database | Migration-defined relational schema (3 tables) | [VERIFIED: database/migrations/2024_01_01_000002_create_time_slots_table.php:14] |
| HTTP Client | `Illuminate\Support\Facades\Http` | [VERIFIED: app/Services/CalendarService.php:7] |
| External Services | External calendar API (env-configured) | [VERIFIED: config/calendar.php:14-15] |

[NOT_FOUND: no composer.json, package.json, or artisan in examples/laravel/slotbooker/] The example app ships application code only, so the exact framework version is inferred from the `Illuminate\*` imports rather than a manifest.

---

## Why This Example is GOOD

1. **Every claim has a verification tag** — the reader always knows what is proven vs. inferred vs. absent.
2. **File:line citations re-derived from source** — checkout commit `9a69c14` and every citation lands on the claimed code.
3. **Quoted code is exact** — the verifier's phase 2 compares each fenced block against the cited slice; paraphrased quotes fail.
4. **NOT_FOUND documents absences** — no BookingService, no email, no SMS. An agent reading this will not hallucinate them.
5. **Section 3 uses discovery tables, not execution traces** — no ASCII arrow flows; step-by-step tracing is deferred to the code-flow doc where it belongs.
6. **Known issues surfaced** — duplicated rules, silent sync failure, unused config, missing unique constraint, constant/literal drift.
7. **Machine-checkable** — the "Verify with" command above exits 0; the doc is only "done" while that stays true.
