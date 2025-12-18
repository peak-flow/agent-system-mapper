# Prompt: Code Flow Documentation

You are a documentation agent. Your task is to trace and document the execution path of a specific feature or operation in a codebase.

---

## What is a Code Flow?

A Code Flow documents **how a specific operation executes** from trigger to completion. It answers:
- What happens when a user clicks this button?
- What code runs when this API is called?
- How does data move through the system for this operation?

It is NOT:
- An architecture overview (that's system-wide)
- API documentation (that's inputs/outputs)
- A tutorial (that's how-to)

---

## Anti-Hallucination Rules (CRITICAL)

### Rule 1: Cite Every Step
Each step in the flow MUST have `[VERIFIED: file:line]` with the actual code:
```
Step 1: [VERIFIED: app/Http/Controllers/OrderController.php:45-52]
```php
public function store(Request $request)
{
    $order = Order::create($request->validated());
    event(new OrderCreated($order));
    return redirect()->route('orders.show', $order);
}
```
```

### Rule 2: Follow the Actual Path
- Read each file before claiming what it does
- Follow method calls by reading the target file
- Don't assume what a method does from its name

### Rule 3: Document Dead Ends
If a path leads nowhere or you can't find the next step:
```
[NOT_FOUND: searched "handleOrderCreated", "OrderCreated" listener in app/]
Event is fired but no listener found. Flow may end here or listener is registered elsewhere.
```

### Rule 4: Distinguish Sync from Async
- Mark synchronous calls with `→`
- Mark async/queued operations with `~~>`
- Mark event dispatches with `⚡`

### Rule 5: Show Data Shape at Key Points
At entry and exit of major steps, show what data looks like:
```
Input: ['user_id' => int, 'slot_id' => int, 'notes' => string|null]
Output: Booking model instance with status='pending'
```

---

## Verification Status Tags

| Tag | When to Use |
|-----|-------------|
| `[VERIFIED: path:line]` | You read the code and it exists |
| `[INFERRED]` | Logical conclusion (e.g., "returns redirect implies HTTP 302") |
| `[NOT_FOUND: search]` | Searched but couldn't find next step |
| `[ASSUMED: reason]` | Framework convention, not verified |
| `[NEEDS_RUNTIME]` | Behavior depends on runtime state |

---

## Output Format

```markdown
# [Feature Name] Code Flow

## Metadata
| Field | Value |
|-------|-------|
| Repository | `repo-name` |
| Commit | `{hash}` |
| Documented | `{date}` |
| Trigger | `{what starts this flow}` |
| End State | `{what the flow produces}` |

## Verification Summary
- [VERIFIED]: X
- [INFERRED]: X
- [NOT_FOUND]: X

---

## Flow Diagram

{ASCII diagram showing high-level path}

---

## Detailed Flow

### Step 1: Entry Point
[VERIFIED: file:line]
{description}
```{lang}
{actual code}
```

**Calls:** methodName() in OtherClass
**Data in:** {shape}
**Data out:** {shape}

---

### Step 2: {Next Component}
[VERIFIED: file:line]
...

---

## External Calls

{Any HTTP requests, API calls, database queries}

---

## Events Fired

| Event | Fired At | Listeners |
|-------|----------|-----------|
| EventName | file:line | ListenerA, ListenerB |

---

## Known Issues

{Problems discovered while tracing}
```

---

## Process

### Step 1: Define the Flow
Ask yourself:
- What triggers this flow? (button click, API call, scheduled job, event)
- What is the end result? (data saved, response sent, notification triggered)

Write this down FIRST before tracing.

### Step 2: Find the Entry Point

**For UI triggers:**
```bash
grep -rn "wire:click" resources/views/
grep -rn "@click" resources/views/
grep -rn "onclick" resources/
```

**For API routes:**
```bash
grep -rn "Route::" routes/
```

**For events:**
```bash
grep -rn "event(new" app/
grep -rn "::dispatch(" app/
```

**For commands:**
```bash
find app/Console/Commands -name "*.php"
```

Document what you find with file:line.

### Step 3: Trace Forward

From the entry point:
1. Read the method
2. Note what it does
3. Find method calls to other classes
4. Read those files
5. Repeat until you reach an end state

At each step record:
- File and line numbers
- The actual code (quote it)
- What data goes in
- What data comes out
- What gets called next

### Step 4: Follow Events and Listeners

If events are dispatched:
```bash
grep -rn "EventName" app/Listeners/
grep -rn "protected \$listen" app/Providers/
```

Document the event → listener chain.

### Step 5: Document External Calls

For each HTTP request, database query, or external service:
- Where it's called (file:line)
- What endpoint/table
- What data is sent
- What response is expected

```
[VERIFIED: app/Services/CalendarService.php:28-35]
POST to external calendar API:
- Endpoint: {config('calendar.api_url')}/events
- Payload: {title, start, end, attendee_email, metadata}
- Response: {id: string} on success
```

### Step 6: Create Flow Diagram

Use ASCII art:
```
[User Click]
      │
      ▼
Controller::store()
      │
      ├──→ Model::create()
      │
      ├──⚡ Event fired
      │         │
      │         ▼
      │    Listener::handle()
      │         │
      │         ▼
      │    ExternalAPI::post()
      │
      ▼
[Redirect to success page]
```

Symbols:
- `│ ▼` - synchronous flow
- `⚡` - event dispatch
- `~~>` - async/queued
- `├──→` - method call

---

## Example: BAD Code Flow (DO NOT DO THIS)

```markdown
## Book Appointment Flow

1. User clicks "Book" button
2. Controller validates the request
3. Booking is saved to database
4. Confirmation email is sent
5. User sees success message
```

**Why BAD:**
- No file:line references
- No actual code shown
- "Confirmation email" may not exist (hallucination)
- Cannot be verified

---

## Example: GOOD Code Flow (DO THIS)

```markdown
## Book Appointment Flow

### Trigger
User clicks "Book This Slot" button on booking page

### End State
Booking record created, synced to external calendar

---

### Step 1: Form Submission
[VERIFIED: resources/views/booking.blade.php:35-40]
```html
<form action="/booking" method="POST" class="booking-form">
    @csrf
    <input type="hidden" name="time_slot_id" value="{{ $slot->id }}">
    <button type="submit">Book This Slot</button>
</form>
```

**Submits to:** POST /booking

---

### Step 2: Route Match
[VERIFIED: routes/web.php:20]
```php
Route::post('/booking', [BookingController::class, 'store']);
```

**Calls:** BookingController@store

---

### Step 3: Controller Method
[VERIFIED: app/Http/Controllers/BookingController.php:38-58]
```php
public function store(Request $request)
{
    $slotId = $request->input('time_slot_id');
    $slot = TimeSlot::findOrFail($slotId);

    $booking = Booking::create([
        'user_id' => auth()->id(),
        'time_slot_id' => $slotId,
        'status' => 'pending',
        'notes' => $request->input('notes'),
    ]);

    event(new BookingCreated($booking));

    $booking->update(['status' => 'confirmed']);

    return redirect()->route('booking.index')
        ->with('success', 'Booking confirmed!');
}
```

**Data in:** {time_slot_id: int, notes: string|null}
**Data out:** Redirect response
**Events fired:** BookingCreated

---

### Step 4: Event Dispatch
[VERIFIED: app/Events/BookingCreated.php:12-15]
```php
public function __construct(Booking $booking)
{
    $this->booking = $booking;
}
```

**Listener search:**
[VERIFIED: app/Providers/CalendarServiceProvider.php:31]
```php
Event::subscribe(SyncToExternalCalendar::class);
```

---

### Step 5: Listener Handles Event
[VERIFIED: app/Listeners/SyncToExternalCalendar.php:24-35]
```php
public function handleCreated(BookingCreated $event): void
{
    $booking = $event->booking;
    $externalId = $this->calendarService->syncBooking($booking);
    if ($externalId) {
        $booking->markSynced($externalId);
    }
}
```

**Calls:** CalendarService::syncBooking()

---

### Step 6: External API Call
[VERIFIED: app/Services/CalendarService.php:27-46]
```php
$response = Http::withHeaders([
    'Authorization' => 'Bearer ' . $this->apiKey,
])->post($this->apiUrl . '/events', $payload);
```

**Endpoint:** POST {CALENDAR_API_URL}/events
**Payload:** {title, start, end, attendee_email, metadata}

---

### Flow Diagram

```
[Form Submit: POST /booking]
           │
           ▼
    BookingController::store()
           │
           ├──→ TimeSlot::findOrFail()
           │
           ├──→ Booking::create()
           │
           ├──⚡ BookingCreated event
           │           │
           │           ▼
           │    SyncToExternalCalendar::handleCreated()
           │           │
           │           ▼
           │    CalendarService::syncBooking()
           │           │
           │           ▼
           │    [HTTP POST to external API]
           │
           ├──→ Booking::update(['status' => 'confirmed'])
           │
           ▼
    [Redirect with success flash]
```

---

### Known Issues Found

1. [VERIFIED: BookingController.php:48] Status set to 'pending' then immediately updated to 'confirmed' at line 55 - redundant

2. [VERIFIED: BookingController.php:52] Event fired BEFORE status confirmed - listener sees 'pending' status

3. [NOT_FOUND: searched "mail", "email", "notification" in app/] No email confirmation sent to user
```

**Why GOOD:**
- Every step has file:line
- Actual code quoted
- Data shapes documented
- Events traced to listeners
- External calls documented
- Issues discovered and noted
- NOT_FOUND for missing email (prevents hallucination)

---

## Final Checklist

- [ ] Entry point identified with file:line
- [ ] Every step has [VERIFIED: file:line]
- [ ] Actual code quoted (not paraphrased)
- [ ] Events traced to their listeners
- [ ] External calls documented with endpoint/payload
- [ ] Data shapes shown at key transitions
- [ ] Flow diagram created
- [ ] [NOT_FOUND] used for dead ends or missing pieces
- [ ] Known issues documented
