# Create Booking Code Flow (SlotBooker)

> **This is an example of GOOD code flow documentation.**
> Every step cites real code in `examples/laravel/slotbooker/` and every quoted
> block is an exact copy of the cited slice, so the verifier can check it.

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/laravel/slotbooker` |
| Commit | `9a69c14` |
| Documented | `2026-08-03` |
| Trigger | User submits the "Book This Slot" form (`POST /booking`) |
| End State | Booking row with status `confirmed`; external calendar event created; redirect with success flash |

**Verify with:**
```bash
python3 verify.py examples/laravel/good-code-flow-doc-example.md --repo-root examples/laravel/slotbooker
```

## Verification Summary
- `[VERIFIED]`: 31 tags — 36/36 citations resolve; 12/12 quoted blocks match their source
- `[INFERRED]`: 1 tag
- `[NOT_FOUND]`: 3 items (no request validation class, no `$listen` array, no email)

---

## Flow Diagram

```
[Form submit: POST /booking]                                  booking.blade.php:33-38
            │
            ▼
routes/web.php:21 ──→ BookingController::store()              BookingController.php:37
            │
            ├──→ TimeSlot::findOrFail($slotId)                BookingController.php:40
            ├──→ inline capacity check (duplicated)           BookingController.php:43-46
            ├──→ Booking::create([... 'pending' ...])         BookingController.php:49-54
            │
            ├──⚡ event(new BookingCreated($booking))          BookingController.php:57
            │        │   (synchronous — subscriber, not queued)
            │        ▼
            │   SyncToExternalCalendar::handleCreated()       SyncToExternalCalendar.php:22-34
            │        │
            │        ├──→ CalendarService::syncBooking()      CalendarService.php:25-52
            │        │         │
            │        │         └──→ HTTP POST {api_url}/events  CalendarService.php:30-33
            │        │
            │        └──→ Booking::markSynced($externalId)    Booking.php:52-56
            │
            ├──→ $booking->update(['status' => 'confirmed'])  BookingController.php:60
            │
            ▼
[Redirect to booking.index with success flash]                BookingController.php:62-63
```

Symbols: `│ ▼` synchronous flow, `⚡` event dispatch, `├──→` method call.

---

## Detailed Flow

### Step 1: Form Submission

[VERIFIED: resources/views/booking.blade.php:33-38]
```html
                    <form action="/booking" method="POST" class="booking-form">
                        @csrf
                        <input type="hidden" name="time_slot_id" value="{{ $slot->id }}">
                        <input type="text" name="notes" placeholder="Notes (optional)">
                        <button type="submit" class="book-btn">Book This Slot</button>
                    </form>
```

Rendered once per available slot. The form action is hardcoded instead of using `route()` — the template's own comment flags this [VERIFIED: resources/views/booking.blade.php:32].

**Submits:** `time_slot_id` (hidden), `notes` (optional text), CSRF token
**To:** `POST /booking`

---

### Step 2: Route Match

[VERIFIED: routes/web.php:21-22]
```php
Route::post('/booking', [BookingController::class, 'store'])
    ->name('booking.store');
```

**Calls:** `BookingController::store()`

---

### Step 3: Controller — Capacity Check and Booking Creation

[VERIFIED: app/Http/Controllers/BookingController.php:37-54]
```php
    public function store(Request $request)
    {
        $slotId = $request->input('time_slot_id');
        $slot = TimeSlot::findOrFail($slotId);

        // Wart: duplicates capacity check from TimeSlot::hasAvailability()
        $confirmedCount = $slot->bookings()->where('status', 'confirmed')->count();
        if ($confirmedCount >= $slot->capacity) {
            return back()->with('error', 'This slot is no longer available');
        }

        // Wart: no validation on notes field, could be XSS
        $booking = Booking::create([
            'user_id' => auth()->id(),
            'time_slot_id' => $slotId,
            'status' => 'pending',  // Wart: should use constant
            'notes' => $request->input('notes'),
        ]);
```

**Data in:** `{time_slot_id: int, notes: string|null}` — raw `$request->input()`, no validation layer
**Data out:** `Booking` model instance with status `'pending'`
**Alternate exit:** slot full → `back()` with error flash (line 45); unknown slot id → `findOrFail` throws (line 40)

[NOT_FOUND: searched "validate", "FormRequest", "rules(" in app/Http/] No request validation class exists for this flow.

---

### Step 4: Event Dispatch

[VERIFIED: app/Http/Controllers/BookingController.php:56-57]
```php
        // Fire event - listener will sync to external calendar
        event(new BookingCreated($booking));
```

The event object just wraps the model:

[VERIFIED: app/Events/BookingCreated.php:13-18]
```php
    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }
```

**Dispatch type:** synchronous (`⚡`). Neither the event nor the listener implements a queue interface, so listeners run inside the request [VERIFIED: app/Events/BookingCreated.php:9-11, app/Listeners/SyncToExternalCalendar.php:10].

---

### Step 5: Listener Wiring (Subscriber Pattern)

The listener is registered as an event subscriber in the provider's `boot()`:

[VERIFIED: app/Providers/CalendarServiceProvider.php:34]
```php
        Event::subscribe(SyncToExternalCalendar::class);
```

[VERIFIED: app/Listeners/SyncToExternalCalendar.php:59-65]
```php
    public function subscribe($events): array
    {
        return [
            BookingCreated::class => 'handleCreated',
            BookingCancelled::class => 'handleCancelled',
        ];
    }
```

[NOT_FOUND: searched "protected $listen" in app/Providers/] No EventServiceProvider `$listen` array — the subscriber is the only wiring, and the listener's own comment notes this is less discoverable.

---

### Step 6: Listener Handles the Event

[VERIFIED: app/Listeners/SyncToExternalCalendar.php:22-34]
```php
    public function handleCreated(BookingCreated $event): void
    {
        $booking = $event->booking;

        Log::info('Syncing new booking to calendar', ['booking_id' => $booking->id]);

        $externalId = $this->calendarService->syncBooking($booking);

        if ($externalId) {
            $booking->markSynced($externalId);
        }
        // Wart: if sync fails, we just log it (in service) but don't retry or notify anyone
    }
```

**Calls:** `CalendarService::syncBooking()` via `CalendarServiceInterface`, constructor-injected [VERIFIED: app/Listeners/SyncToExternalCalendar.php:14-17] and bound in the provider [VERIFIED: app/Providers/CalendarServiceProvider.php:19-22]
**Data in:** `BookingCreated` event carrying a Booking with status `'pending'`
**Data out:** none (void) — side effects only

---

### Step 7: External API Call

[VERIFIED: app/Services/CalendarService.php:25-52]
```php
    public function syncBooking(Booking $booking): ?string
    {
        $payload = $this->buildPayload($booking);

        // NOTE: no try/catch here - errors bubble up
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl . '/events', $payload);

        if ($response->successful()) {
            $externalId = $response->json('id');
            Log::info('Booking synced to calendar', [
                'booking_id' => $booking->id,
                'external_id' => $externalId,
            ]);
            return $externalId;
        }

        // Wart: we log but don't throw, caller doesn't know it failed
        Log::error('Calendar sync failed', [
            'booking_id' => $booking->id,
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }
```

The payload is built by a private helper:

[VERIFIED: app/Services/CalendarService.php:86-95]
```php
        return [
            'title' => 'Booking: ' . $user->name,
            'start' => $slot->start_time->format('Y-m-d\TH:i:s'),
            'end' => $slot->end_time->format('Y-m-d\TH:i:s'),
            'attendee_email' => $user->email,
            'metadata' => [
                'booking_id' => $booking->id,
                'source' => 'slotbooker',
            ],
        ];
```

**Endpoint:** `POST {config('calendar.api_url')}/events`, Bearer auth from `calendar.api_key` [VERIFIED: config/calendar.php:14-15]
**Data out:** external event id (`$response->json('id')`) on success; `null` on API failure — the caller cannot distinguish failure from success-without-id

---

### Step 8: Sync Result Stored; Controller Finishes

On a successful sync the listener persists the external id:

[VERIFIED: app/Models/Booking.php:52-56]
```php
    public function markSynced($externalId)
    {
        $this->external_calendar_id = $externalId;
        $this->save();
    }
```

Control returns to the controller (the listener ran synchronously), which confirms and redirects **regardless of sync outcome**:

[VERIFIED: app/Http/Controllers/BookingController.php:59-63]
```php
        // Wart: assuming event succeeded, mark as confirmed
        $booking->update(['status' => 'confirmed']);

        return redirect()->route('booking.index')
            ->with('success', 'Booking confirmed!');
```

**Data out:** HTTP redirect to `booking.index` with a `success` flash message. [INFERRED] `redirect()` produces an HTTP 302 response.

---

## External Calls

| Call | Where | Endpoint | Payload | Response |
|------|-------|----------|---------|----------|
| Calendar event create | [VERIFIED: app/Services/CalendarService.php:30-33] | `POST {calendar.api_url}/events` | `{title, start, end, attendee_email, metadata: {booking_id, source}}` [VERIFIED: app/Services/CalendarService.php:86-95] | JSON body with `id` on success [VERIFIED: app/Services/CalendarService.php:36] |

Database writes in this flow:
- Booking insert with status `'pending'` [VERIFIED: app/Http/Controllers/BookingController.php:49-54]
- `external_calendar_id` saved by `markSynced` [VERIFIED: app/Models/Booking.php:54-55]
- Status update to `'confirmed'` [VERIFIED: app/Http/Controllers/BookingController.php:60]

---

## Events Fired

| Event | Fired At | Listeners |
|-------|----------|-----------|
| `BookingCreated` | [VERIFIED: app/Http/Controllers/BookingController.php:57] | `SyncToExternalCalendar::handleCreated` [VERIFIED: app/Listeners/SyncToExternalCalendar.php:62] |

`BookingCancelled` also exists but is fired only by the cancel flow [VERIFIED: app/Http/Controllers/BookingController.php:85] — out of scope for this document.

---

## Known Issues

1. **Redundant status dance** — the booking is created `'pending'` and then unconditionally updated to `'confirmed'` a few lines later, with no branch in between [VERIFIED: app/Http/Controllers/BookingController.php:52, 60]
2. **Event fires before final state** — the listener (and the external calendar) observe a `'pending'` booking [VERIFIED: app/Http/Controllers/BookingController.php:57, 60]
3. **Silent sync failure** — `syncBooking()` returns `null` on API failure; the controller confirms anyway, so the user sees "Booking confirmed!" with no calendar event [VERIFIED: app/Services/CalendarService.php:44-51, app/Http/Controllers/BookingController.php:60-63]
4. **No transport error handling** — an HTTP exception aborts the request after the booking row exists but before confirmation, leaving the booking stuck at `'pending'` [VERIFIED: app/Services/CalendarService.php:29-33]
5. **Overbooking window** — the inline capacity check counts only `'confirmed'` bookings and there is no unique constraint on (`user_id`, `time_slot_id`) [VERIFIED: app/Http/Controllers/BookingController.php:43, database/migrations/2024_01_01_000003_create_bookings_table.php:27-28]
6. [NOT_FOUND: searched "mail", "Mail::", "Notification", "notify" in app/] No confirmation email or notification is sent anywhere in this flow.

---

## Why This Example is GOOD

1. **Every step has `[VERIFIED: file:line]`** with the actual code pasted, not paraphrased.
2. **The event chain is traced, not assumed** — dispatch → subscriber registration → handler method, each with evidence.
3. **Sync vs. async is explicit** — the listener is shown to run in-request because no queue interface exists.
4. **Data shapes at boundaries** — what the form submits, what the API receives, what comes back.
5. **Dead ends are documented** — no validation class, no `$listen` array, no email: `[NOT_FOUND]` with the searches that were run.
6. **Known issues fall out of the trace** — the pending→confirmed dance and the silent sync failure are visible only because the real path was followed.
7. **Machine-checkable** — the "Verify with" command exits 0.
