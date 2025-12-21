# SlotBooker Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Commit | `e043013` |
| Documented | `2025-01-15` |
| Verification Status | `Verified` |

## Verification Summary
- [VERIFIED]: 25 claims
- [INFERRED]: 3 claims
- [NOT_FOUND]: 4 items (email, SMS, BookingService, extra tables)
- [ASSUMED]: 2 items (Laravel conventions)

---

## 1. System Purpose

SlotBooker is a booking system that allows users to reserve time slots and syncs those bookings to an external calendar API.

[VERIFIED: routes/web.php:16-26] The system exposes four routes:
- `GET /booking` - view available slots
- `POST /booking` - create booking
- `POST /booking/{booking}/cancel` - cancel booking
- `GET /api/slots/availability` - AJAX availability check

---

## 2. Component Map

| Component | Location | Responsibility | Verified |
|-----------|----------|----------------|----------|
| Models | `app/Models/` | Data entities and relationships | [VERIFIED] |
| Migrations | `database/migrations/` | Schema definitions (3 tables) | [VERIFIED] |
| Controller | `app/Http/Controllers/BookingController.php` | HTTP request handling | [VERIFIED] |
| Service | `app/Services/CalendarService.php` | External API integration | [VERIFIED] |
| Contract | `app/Contracts/CalendarServiceInterface.php` | Service abstraction | [VERIFIED] |
| Events | `app/Events/` | Domain events | [VERIFIED] |
| Listener | `app/Listeners/SyncToExternalCalendar.php` | Event handling | [VERIFIED] |
| Provider | `app/Providers/CalendarServiceProvider.php` | Dependency wiring | [VERIFIED] |
| Config | `config/calendar.php` | External API settings | [VERIFIED] |
| View | `resources/views/booking.blade.php` | UI template | [VERIFIED] |
| JavaScript | `public/js/booking.js` | Client-side behavior | [VERIFIED] |

[NOT_FOUND: searched "BookingService" in app/] No BookingService exists. Booking logic lives directly in BookingController.

---

## 3. Data Models

### User (`app/Models/User.php`)

[VERIFIED: app/Models/User.php:10-12]
```php
protected $fillable = ['name', 'email', 'phone'];
```

Relationships:
- [VERIFIED: app/Models/User.php:17-20] `hasMany(Booking::class)`

### Booking (`app/Models/Booking.php`)

[VERIFIED: app/Models/Booking.php:10-16]
```php
protected $fillable = [
    'user_id',
    'time_slot_id',
    'status',
    'notes',
    'external_calendar_id',
];
```

Status constants defined:
- [VERIFIED: app/Models/Booking.php:19-21] `STATUS_PENDING`, `STATUS_CONFIRMED`, `STATUS_CANCELLED`

[INFERRED] However, some code uses string literals instead of constants (e.g., `'confirmed'` at BookingController.php:53).

Relationships:
- [VERIFIED: app/Models/Booking.php:23-26] `belongsTo(User::class)`
- [VERIFIED: app/Models/Booking.php:28-31] `belongsTo(TimeSlot::class)`

### TimeSlot (`app/Models/TimeSlot.php`)

[VERIFIED: app/Models/TimeSlot.php:10-15]
```php
protected $fillable = [
    'start_time',
    'end_time',
    'capacity',
    'is_available',
];
```

Relationships:
- [VERIFIED: app/Models/TimeSlot.php:23-26] `hasMany(Booking::class)`

---

## 4. Data Flow: Booking Creation

```
User clicks "Book This Slot"
        │
        ▼
[routes/web.php:20]
POST /booking → BookingController@store
        │
        ▼
[BookingController.php:38-55]
- Finds TimeSlot
- Checks capacity (duplicated from model)
- Creates Booking with status 'pending'
- Fires BookingCreated event
- Updates status to 'confirmed'
        │
        ▼
[Events/BookingCreated.php]
Event dispatched with Booking instance
        │
        ▼
[Listeners/SyncToExternalCalendar.php:24-35]
handleCreated() called
        │
        ▼
[Services/CalendarService.php:27-46]
- Builds payload with booking data
- POST to external API
- Returns external_id if successful
        │
        ▼
[Listeners/SyncToExternalCalendar.php:32-33]
booking.markSynced(external_id)
        │
        ▼
[BookingController.php:57-58]
Redirect with success message
```

[VERIFIED: Each step above references actual file:line]

---

## 5. Data Flow: Booking Cancellation

```
User clicks "Cancel" button
        │
        ▼
[public/js/booking.js:47-54]
confirmCancel() shows modal, sets form action
        │
        ▼
[routes/web.php:23]
POST /booking/{booking}/cancel → BookingController@cancel
        │
        ▼
[BookingController.php:65-82]
- Verifies ownership (user_id check)
- Calls booking.canCancel()
- Updates status to 'cancelled'
- Fires BookingCancelled event
        │
        ▼
[Models/Booking.php:33-44]
canCancel() checks:
- Status is not 'cancelled'
- More than 24 hours until slot
        │
        ▼
[Listeners/SyncToExternalCalendar.php:40-52]
handleCancelled() calls calendarService.removeBooking()
        │
        ▼
[Services/CalendarService.php:51-67]
DELETE request to external API
```

---

## 6. External Dependencies

### External Calendar API
[VERIFIED: config/calendar.php:14-15]
```php
'api_url' => env('CALENDAR_API_URL', 'https://api.example-calendar.com/v1'),
'api_key' => env('CALENDAR_API_KEY'),
```

Called from:
- [VERIFIED: Services/CalendarService.php:28-31] POST `/events` for sync
- [VERIFIED: Services/CalendarService.php:60] DELETE `/events/{id}` for removal

### Environment Variables Required
- `CALENDAR_API_URL` - External API base URL
- `CALENDAR_API_KEY` - Authentication key

[NOT_FOUND: searched "mail\|email" in app/] No email service integration.
[NOT_FOUND: searched "sms\|twilio\|nexmo" in app/] No SMS integration.

---

## 7. File/Folder Conventions

| Pattern | Location | Example |
|---------|----------|---------|
| Models | `app/Models/` | `User.php`, `Booking.php` |
| Controllers | `app/Http/Controllers/` | `BookingController.php` |
| Services | `app/Services/` | `CalendarService.php` |
| Contracts | `app/Contracts/` | `CalendarServiceInterface.php` |
| Events | `app/Events/` | `BookingCreated.php` |
| Listeners | `app/Listeners/` | `SyncToExternalCalendar.php` |
| Providers | `app/Providers/` | `CalendarServiceProvider.php` |
| Views | `resources/views/` | `booking.blade.php` |
| JS | `public/js/` | `booking.js` |
| Config | `config/` | `calendar.php` |

[ASSUMED: Laravel convention] Routes in `routes/web.php` for web routes.

---

## 8. Service Provider Wiring

[VERIFIED: app/Providers/CalendarServiceProvider.php:18-21]
```php
$this->app->bind(
    CalendarServiceInterface::class,
    CalendarService::class
);
```

[VERIFIED: app/Providers/CalendarServiceProvider.php:31]
```php
Event::subscribe(SyncToExternalCalendar::class);
```

[ASSUMED: Laravel convention] Provider registered in `config/app.php` providers array.

---

## 9. Frontend-Backend Interaction

### AJAX Availability Check

[VERIFIED: public/js/booking.js:17-25]
```javascript
function checkSlotAvailability(slotId) {
    fetch('/api/slots/availability?slot_id=' + slotId)
        .then(response => response.json())
        .then(data => {
            updateSlotDisplay(slotId, data);
        });
}
```

[VERIFIED: app/Http/Controllers/BookingController.php:89-100]
Returns JSON with `available`, `spots_left`, `start_time`.

### Auto-refresh Polling

[VERIFIED: public/js/booking.js:73-78]
```javascript
setInterval(function() {
    document.querySelectorAll('.slot-card').forEach(card => {
        checkSlotAvailability(card.dataset.slotId);
    });
}, 30000);
```

[INFERRED] Polling continues even when browser tab is inactive (no visibility check).

---

## 10. Known Issues & Technical Debt

### Duplicated Logic

**24-hour cancellation rule:**
- [VERIFIED: app/Models/Booking.php:40] Hardcoded `>= 24`
- [VERIFIED: public/js/booking.js:11] Hardcoded `CANCEL_HOURS_BEFORE = 24`
- [VERIFIED: config/calendar.php:39] Defined as `'cancel_hours_before' => 24` but NOT USED

**Capacity checking:**
- [VERIFIED: app/Models/TimeSlot.php:33-40] `hasAvailability()` method
- [VERIFIED: app/Http/Controllers/BookingController.php:42-45] Duplicated in controller

### Missing Error Handling

[VERIFIED: app/Services/CalendarService.php:27-31]
```php
$response = Http::withHeaders([...])->post($this->apiUrl . '/events', $payload);
```
No try/catch. HTTP errors will throw unhandled exceptions.

[VERIFIED: app/Services/CalendarService.php:43-47]
Sync failure is logged but not surfaced to user or retried.

### Unused Configuration

[VERIFIED: config/calendar.php:26-27]
```php
'sync_timeout' => env('CALENDAR_SYNC_TIMEOUT', 30),
'retry_attempts' => env('CALENDAR_RETRY_ATTEMPTS', 3),
```
[NOT_FOUND: searched "sync_timeout\|retry_attempts" in app/Services/]
These config values are defined but never read.

### Potential XSS

[VERIFIED: app/Http/Controllers/BookingController.php:49]
```php
'notes' => $request->input('notes'),
```
No sanitization on notes field. Stored directly to database.

[INFERRED] If notes are displayed without escaping, XSS is possible.

### Status Constant Inconsistency

[VERIFIED: app/Models/Booking.php:19-21] Constants defined:
```php
const STATUS_PENDING = 'pending';
const STATUS_CONFIRMED = 'confirmed';
const STATUS_CANCELLED = 'cancelled';
```

But literal strings used in:
- [VERIFIED: app/Http/Controllers/BookingController.php:48] `'status' => 'pending'`
- [VERIFIED: app/Models/TimeSlot.php:37] `->where('status', 'confirmed')`

---

## Why This Example is GOOD

1. **Every claim has a verification tag** - Reader knows what's proven vs assumed

2. **File:line citations** - Can checkout commit `e043013` and verify each claim

3. **Actual code quoted** - Not descriptions, but the real code

4. **NOT_FOUND explicitly stated** - Documents what DOESN'T exist (email, SMS, BookingService)

5. **Issues surfaced** - Found real problems: duplicated logic, missing error handling, unused config

6. **Metadata locked to commit** - Documentation tied to specific code state

7. **Verification summary** - Quick assessment of documentation reliability

8. **Both flows documented** - Shows booking creation AND cancellation paths

9. **Frontend-backend connection** - Documents how JS interacts with API

10. **Actionable for AI agents** - An agent reading this can:
    - Know exactly where to make changes
    - Understand what doesn't exist (won't hallucinate BookingService)
    - See the actual patterns used
    - Identify risks before modifying
