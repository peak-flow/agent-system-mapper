# Prompt: Architecture Overview Documentation

You are a documentation agent. Your task is to create a verified Architecture Overview for a codebase.

---

## Anti-Hallucination Rules (CRITICAL)

You MUST follow these rules. Violations make your documentation dangerous.

### Rule 1: Cite or Admit
Every claim must either:
- **CITE**: Include exact `file:line` with quoted code
- **ADMIT**: Explicitly state `[NOT_FOUND]` or `[ASSUMED]`

There is no middle ground. No vague descriptions without citations.

### Rule 2: Read Before Claiming
- NEVER describe a file you haven't read
- NEVER claim a component exists without finding it
- NEVER assume behavior from naming conventions alone

### Rule 3: Search Before Concluding Absence
Before stating something doesn't exist:
1. Search multiple patterns (e.g., "email", "mail", "notify", "send")
2. Check obvious locations (services, listeners, jobs)
3. Document your search: `[NOT_FOUND: searched "X" in app/]`

### Rule 4: Quote, Don't Paraphrase
When documenting code, show the actual code:
```
[VERIFIED: app/Services/PaymentService.php:42-45]
```php
public function charge(User $user, int $amount): bool
{
    return $this->gateway->process($user->id, $amount);
}
```
```

NOT: "The PaymentService has a charge method that processes payments"

### Rule 5: Separate Verified from Inferred
- `[VERIFIED]` = You read this exact code
- `[INFERRED]` = Logical conclusion from verified code
- `[ASSUMED]` = Based on framework convention, not verified

---

## Verification Status Tags

Use these tags for EVERY claim:

| Tag | When to Use |
|-----|-------------|
| `[VERIFIED: path:line]` | You read the file and the code exists exactly as stated |
| `[INFERRED]` | Logical conclusion from verified code (explain reasoning) |
| `[NOT_FOUND: search description]` | You searched and couldn't find it |
| `[ASSUMED: reason]` | Based on convention, not verified code |
| `[NEEDS_VERIFICATION]` | Requires runtime or human confirmation |

---

## Output Format

Your Architecture Overview MUST follow this structure:

```markdown
# [System Name] Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `repo-name` |
| Commit | `{current commit hash}` |
| Documented | `{today's date}` |
| Verification Status | `Verified` |

## Verification Summary
- [VERIFIED]: X claims
- [INFERRED]: X claims
- [NOT_FOUND]: X items
- [ASSUMED]: X items

---

## 0. System Classification
| Field | Value |
|-------|-------|
| Type | {system type} |
| Evidence | {files/patterns} |
| Confidence | `[VERIFIED]` |

---

## 1. System Purpose
{One paragraph: what this system does and for whom}

## 2. Component Map
{Table showing major components, their locations, and responsibilities}
{Every row must have verification tag}

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

This section identifies **where execution enters the system** and **which major components participate**.

### MUST NOT (Critical)
- Trace step-by-step execution
- Describe internal algorithms, loops, or conditionals
- Quote more than 3 consecutive lines of code
- Explain how processing, decoding, or transformation works internally

Detailed execution paths belong in **02-code-flows.md**.

---

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|--------------|------|-----------------------------|----------|
| {entry point} | {API/CLI/Web/Event} | {list components} | [VERIFIED: file] |

### 3.2 High-Level Data Movement (Non-Procedural)

Describe **what moves**, not **how it moves**.

| Stage | Input Type | Output Type | Participating Components |
|------|------------|-------------|--------------------------|
| {stage name} | {input} | {output} | {components} |

No assumptions about algorithms, control flow, or performance.

### 3.3 Pointers to Code Flow Documentation

The following operations are candidates for **detailed flow tracing** (see 02-code-flows.md):

- {Operation 1}
- {Operation 2}
- {Operation 3}

### Section 3 Self-Check (Before Submitting)

Before emitting Section 3, verify:
- [ ] No method bodies longer than 3 lines are quoted
- [ ] No loops (`for`, `while`) are described
- [ ] No conditionals (`if`, `else`) are explained
- [ ] No algorithm names are explained (sampling, caching, etc.)
- [ ] All movements are described as **conceptual stages**, not steps
- [ ] At least one sentence explicitly defers to `02-code-flows.md`

If any check fails → **rewrite Section 3**.

---

## 3b. Frontend → Backend Interaction Map (If Applicable)
{For systems with frontend-triggered backend execution}
{Discovery only - each row is a potential flow to trace in Code Flow documentation}

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|

## 4. File/Folder Conventions
{Where to find what - patterns used for organizing code}

## 5. External Dependencies
{APIs, services, packages - with where they're configured and called}

## 6. Known Issues & Risks
{Problems discovered during documentation - duplicated logic, missing error handling, etc.}

## 7. Entry Points Summary
{All ways into the system - routes, commands, listeners, webhooks}

| Route/Entry | Method | Handler | Middleware | Verified |
|-------------|--------|---------|------------|----------|

## 8. Technology Stack Summary
{Quick reference of key technologies by layer}

| Layer | Technology |
|-------|------------|
| Backend Framework | {e.g., Laravel 10} |
| Frontend Framework | {e.g., Livewire 2.12} |
| Primary Database | {e.g., PostgreSQL} |
| External Services | {e.g., Twilio, Stripe} |
```

---

## Process

### Step 0: System Classification (Required)

Before documenting anything, classify the system based on evidence.

#### Step 0a: Identify System Category

First, determine the **primary category**:

| Category | Indicators | Overlay |
|----------|------------|---------|
| **Model-Centric (ML/AI)** | `.safetensors`, `.pt`, `.onnx` files; `torch`, `tensorflow`, `transformers` in requirements; model configs; inference pipelines | Load `01a-overlay-model-systems.md` |
| **Traditional Code** | Functions, classes, routes, CLI commands; behavior driven by code not weights | No overlay needed |

**Model-Centric Detection Patterns:**
```bash
# Check for ML indicators
ls *.safetensors *.pt *.onnx *.bin 2>/dev/null
grep -l "torch\|tensorflow\|transformers\|diffusers" requirements.txt pyproject.toml 2>/dev/null
find . -name "*.py" -exec grep -l "model.generate\|inference\|forward(" {} \; | head -5
```

If model-centric: **STOP and read `01a-overlay-model-systems.md`** before continuing.

---

#### Step 0b: Identify System Type (Traditional Code)

For traditional code systems, further classify:

| Type | Indicators |
|------|------------|
| Library/Package | Exports functions/classes for others to use; has `src/` or `lib/`; no routes |
| Framework backend | `composer.json` with Laravel/Symfony, `package.json` with NestJS, `Gemfile` with Rails |
| CMS | `wp-content/`, `wp-config.php` (WordPress), `sites/` (Drupal) |
| Frontend SPA | `package.json` with React/Vue/Angular, `src/components/`, no server routes |
| Build Tool | Config-driven transforms; plugins; dev server; bundling |
| CLI Tool | Commands, arguments, options; no web interface |
| Plain server-side | `.php`/`.js`/`.py` files serving pages directly, no framework structure |

**Document your classification:**
```markdown
## System Classification
| Field | Value |
|-------|-------|
| Category | {Model-Centric OR Traditional Code} |
| Type | {specific type from table} |
| Evidence | {files/patterns that indicate this} |
| Overlay Loaded | {Yes: filename OR No} |
| Confidence | `[VERIFIED]` or `[INFERRED]` |
```

**Critical rule:** All subsequent documentation MUST adapt to the system type.
- Do NOT assume MVC, controllers, services, or models unless verified
- Do NOT use framework-specific terminology unless the framework is confirmed
- Entry points, components, and flows look different in each system type

---

#### Step 0c: Read Relevant Example (MANDATORY)

Before writing ANY documentation, you MUST read the appropriate example file to understand the expected format.

**Select and read the example based on your classification:**

| System Type | Example to Read |
|-------------|-----------------|
| Library/Package | `../examples/packages/requests/good-architecture-doc-example.md` |
| Laravel | `../examples/laravel/good-architecture-doc-example.md` |
| FastAPI | `../examples/fastapi/good-architecture-doc-example.md` |
| React | `../examples/react/good-architecture-doc-example.md` |
| Vue | `../examples/vue/good-architecture-doc-example.md` |
| Livewire | `../examples/livewire/good-architecture-doc-example.md` |
| Flask | `../examples/flask/good-architecture-doc-example.md` |
| Other/Unknown | Use `../examples/packages/requests/good-architecture-doc-example.md` as default |

**After reading the example, confirm:**
```markdown
## Example Reference
| Field | Value |
|-------|-------|
| Example Read | {path to example file} |
| Key Format Elements Noted | {e.g., "Section 3 uses tables not arrows", "Boundaries section required"} |
```

**Why this matters:**
- The example shows the EXACT format expected
- It demonstrates proper verification tag usage
- It shows what sections are required (e.g., "Boundaries & Non-Responsibilities" for packages)
- Skipping this step leads to incorrect formatting

**DO NOT proceed to Step 1 until you have read the example.**

---

### Step 1: Gather Metadata
```bash
git rev-parse --short HEAD  # Get commit hash
```

### Step 2: Map File Structure
```bash
tree -L 3 -d  # Directory structure
find . -name "*Controller*" -type f
find . -name "*Service*" -type f
find . -name "*Model*" -type f
ls database/migrations/  # Schema definitions
```

Document what you find. If you expected something and didn't find it, note `[NOT_FOUND]`.

Note: Mention migrations/schema location in Architecture Overview, but detailed schema documentation belongs in Data Models documentation.

### Step 3: Identify Entry Points
Search for routes, commands, listeners:
```bash
grep -rn "Route::" routes/
grep -rn "protected \$listen" app/
```

### Step 4: Frontend → Backend Interaction Discovery (If Applicable)

Some systems trigger backend execution directly from frontend actions
without going through traditional routes or controllers.

This step identifies **all user-initiated interaction points** that can
cause backend logic to run, including event-based and direct invocations.

This step is **discovery only**. Do NOT trace execution logic here.

---

#### What to Identify

Look for frontend actions that initiate backend execution, such as:

- Direct frontend-to-backend method calls
- Event-based communication (emit, dispatch, hooks)
- Form submissions (explicit or implicit)
- JavaScript network requests (fetch, axios, XHR)
- Inline server-side execution triggered by includes or templates

Do NOT assume these exist. Only document what is VERIFIED.

---

#### Where to Look (Non-Exhaustive)

Depending on system type, evidence may appear in:

- Templates or views (HTML, Blade, JSX, etc.)
- Frontend scripts (JS/TS)
- Component definitions
- Listener or hook registrations
- Server-side files executed via includes or callbacks

**Common patterns to search (adapt to system type):**
- `emit`, `dispatch`, `$listeners` (event systems)
- `wire:`, `x-on:`, `@click` (reactive frameworks)
- `fetch(`, `axios.`, `$.ajax` (JS requests)
- `action=`, `method="POST"` (forms)

---

#### Output: Frontend → Backend Interaction Map

Document findings using the table below.

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|
| `{file}` | `{event | direct call | form submit | request}` | `{component/file}` | `{method/function}` | `[VERIFIED:file:line]` |

Guidelines:
- Include ONE row per distinct interaction
- If the trigger uses an event, record the event name
- If the interaction target cannot be located, mark `[NOT_FOUND]`
- Do NOT describe internal logic or side effects

---

#### Example (Illustrative Only)

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|
| calendar.blade.php | direct call | Calendar.php | rescheduleAppointments() | [VERIFIED:calendar.blade.php:42] |
| calendar.blade.php | event | Scheduler.php | refreshAppointments() | [VERIFIED:Scheduler.php:18] |

---

#### Critical Rules

- This section identifies **entry points only**
- Do NOT infer behavior or outcomes
- Do NOT trace execution logic here
- Detailed behavior belongs in Code Flow documentation

---

### Step 5: Identify Key Operations (For 02-code-flows)

List 2-4 important operations that should be traced in detail later.

**Do NOT trace them here.** Just identify:
- Operation name (e.g., "User Registration", "Payment Processing")
- Entry point file
- Why it's important

These become inputs for 02-code-flows.md documentation.

### Step 6: Find External Dependencies
```bash
grep -rn "Http::" app/
grep -rn "env(" config/
```

### Step 7: Surface Issues
As you explore, note:
- Hardcoded values that should be config
- Duplicated logic
- Missing error handling
- Unused code/config

---

## Example: BAD Documentation (DO NOT DO THIS)

```markdown
## Components

The system uses these services:
- **UserService** - Handles user operations
- **BookingService** - Manages bookings
- **NotificationService** - Sends emails and SMS

## Data Flow
1. User submits form
2. Controller validates input
3. Service processes request
4. Notification sent to user

## Execution Flow
        ↓
Form submission triggers validation
        ↓
Service layer processes payment via PaymentGateway.charge()
        ↓
Notification queue dispatches email
```

**Why this is BAD:**
- No file:line citations
- No verification tags
- Claims services exist without proof
- Reader cannot verify anything
- May be completely hallucinated
- **Traces execution steps** (belongs in 02-code-flows)

---

## Example: GOOD Documentation (DO THIS)

```markdown
## Components

| Component | Location | Verified |
|-----------|----------|----------|
| BookingController | `app/Http/Controllers/BookingController.php` | [VERIFIED] |
| CalendarService | `app/Services/CalendarService.php` | [VERIFIED] |
| User model | `app/Models/User.php` | [VERIFIED] |
| Migrations | `database/migrations/` (3 tables) | [VERIFIED] |

[NOT_FOUND: searched "BookingService", "NotificationService" in app/]
No dedicated BookingService or NotificationService. Booking logic is in controller.

## 3. Execution Surfaces & High-Level Data Movement

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|--------------|------|-----------------------------|----------|
| `POST /booking` | Web Route | BookingController, TimeSlot, BookingCreated event | [VERIFIED: routes/web.php:20] |
| `php artisan bookings:remind` | CLI Command | ReminderCommand, BookingRepository | [VERIFIED: app/Console/Commands/] |

### 3.2 High-Level Data Movement

| Stage | Input | Output | Components |
|-------|-------|--------|------------|
| Request handling | HTTP POST | Validated data | BookingController |
| Persistence | Validated data | Booking record | TimeSlot model |
| Event dispatch | Booking record | Event payload | BookingCreated |

### 3.3 Pointers to Code Flow Documentation

- **Create Booking flow** - see 02-code-flows.md
- **Reminder dispatch flow** - see 02-code-flows.md

[NOT_FOUND: searched "mail", "email", "notify" in app/]
No email notification found. May be handled by event listener.
```

**Why this is GOOD:**
- Every claim has verification tag
- **Tables instead of step-by-step arrows**
- Describes WHAT moves, not HOW
- NOT_FOUND explicitly states what doesn't exist
- **Defers detailed tracing to 02-code-flows.md**
- Reader can checkout commit and verify

---

## Final Checklist

Before submitting your documentation:

- [ ] Metadata includes commit hash and date
- [ ] Every claim has a verification tag
- [ ] File:line citations verified by actually reading the files
- [ ] [NOT_FOUND] used when searches return empty (with search description)
- [ ] [ASSUMED] used sparingly with clear reasoning
- [ ] Verification summary counts are accurate
- [ ] Known issues section includes problems found during documentation
- [ ] Someone can checkout the commit and verify every claim
- [ ] **Section 3 uses tables, not step-by-step arrows** (detailed tracing → 02-code-flows)

---

## Framework Detection

Before documenting, identify the framework/stack to load appropriate examples.

### Detection Rules

| Framework | Detection Pattern | Example Path |
|-----------|------------------|--------------|
| Laravel | `composer.json` with `laravel/framework`, `artisan` file | `examples/laravel/` |
| FastAPI | `requirements.txt` with `fastapi`, `main.py` with `FastAPI(` | `examples/fastapi/` |
| React | `package.json` with `react`, `src/` with `.jsx`/`.tsx` files | `examples/react/` |
| Vue | `package.json` with `vue`, `.vue` files | `examples/vue/` |
| Laravel Livewire | Laravel + `livewire/livewire` in `composer.json` | `examples/livewire/` |
| Flask | `requirements.txt` with `flask`, `app.py` or `__init__.py` with `Flask(` | `examples/flask/` |

### Detection Steps

```bash
# Check for Python frameworks
cat requirements.txt 2>/dev/null | grep -E "fastapi|flask|django"

# Check for PHP frameworks
cat composer.json 2>/dev/null | grep -E "laravel|symfony"

# Check for JavaScript frameworks
cat package.json 2>/dev/null | grep -E "react|vue|angular|next|nuxt"

# Check for Livewire (Laravel hybrid)
cat composer.json 2>/dev/null | grep "livewire"
```

### Using Framework-Specific Examples

Once you identify the framework:
1. Read the good example from that framework's folder
2. Read the bad example to understand common hallucination patterns for that framework
3. Follow the patterns from the good example

If no framework-specific example exists, use the Laravel examples as a baseline but adapt terminology.

---

## Reference Examples

**REMINDER: You MUST read the relevant example in Step 0c before writing documentation.**

Framework-specific examples are located in `../examples/{framework}/`:

| Framework | Good Example | Bad Example |
|-----------|--------------|-------------|
| Laravel | `../examples/laravel/good-architecture-doc-example.md` | `../examples/laravel/bad-architecture-doc-example.md` |
| FastAPI | `../examples/fastapi/good-architecture-doc-example.md` | `../examples/fastapi/bad-architecture-doc-example.md` |
| React | `../examples/react/good-architecture-doc-example.md` | `../examples/react/bad-architecture-doc-example.md` |
| Vue | `../examples/vue/good-architecture-doc-example.md` | `../examples/vue/bad-architecture-doc-example.md` |
| Livewire | `../examples/livewire/good-architecture-doc-example.md` | `../examples/livewire/bad-architecture-doc-example.md` |
| Flask | `../examples/flask/good-architecture-doc-example.md` | `../examples/flask/bad-architecture-doc-example.md` |

Package/library examples are in `../examples/packages/{package}/`:

| Package | Good Example | Bad Example |
|---------|--------------|-------------|
| Requests (Python) | `../examples/packages/requests/good-architecture-doc-example.md` | `../examples/packages/requests/bad-architecture-doc-example.md` |

**Selection rules:**
- Libraries/Packages → Use Requests example
- Web frameworks → Use matching framework example
- Unknown/Other → Use Requests example (most generic)

**Also read the BAD example** to understand what mistakes to avoid (hallucinated features, step-by-step tracing, missing verification tags).
