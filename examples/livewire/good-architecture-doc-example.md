# ApprovalFlow Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/livewire/approval-flow/` |
| Commit | `9a69c14` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

**Verify with:**
```bash
python3 verify.py examples/livewire/good-architecture-doc-example.md --repo-root examples/livewire/approval-flow
```

## Verification Summary
- `[VERIFIED]`: 88 tags (104 `file:line` citations, all resolving; 17 quoted blocks, all matching)
- `[INFERRED]`: 1 claim (database driver)
- `[NOT_FOUND]`: 13 items (services, extra components, extra tables, real-time, attachments, approval chains, email/SMS, Alpine.js, CSS framework, API routes, cancellation path, external services, auth scaffolding)
- `[ASSUMED]`: 1 item (Laravel auth conventions)

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | Laravel Livewire hybrid (server-rendered pages with reactive components) |
| Evidence | `composer.json` requires `livewire/livewire` [VERIFIED: composer.json:7]; five Livewire component classes under `app/Livewire/` [VERIFIED: app/Livewire/RequestList.php:11, app/Livewire/RequestForm.php:10] |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` |

---

## 1. System Purpose

ApprovalFlow is a **multi-step approval workflow system**: requesters draft requests with a title, description, and dollar amount; reviewers and admins review, approve, or reject them; every status change is written to an audit trail. It is a Laravel 10 + Livewire 3 application.

[VERIFIED: composer.json:5-7]
```json
        "php": "^8.2",
        "laravel/framework": "^10.0",
        "livewire/livewire": "^3.0"
```

Key capabilities:

- Draft → submit-for-review lifecycle on the Request model [VERIFIED: app/Models/Request.php:66-79]
- Approve / reject by reviewers [VERIFIED: app/Models/Request.php:84-93, app/Models/Request.php:98-107]
- Role-based review permissions via a backed enum [VERIFIED: app/Enums/UserRole.php:23-26]
- Six-state status workflow [VERIFIED: app/Enums/RequestStatus.php:5-12]
- Comments with internal/public visibility [VERIFIED: app/Models/Comment.php:36-43]
- Audit trail of status changes [VERIFIED: app/Models/AuditLog.php:54-67]

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| RequestList | `app/Livewire/RequestList.php` | Paginated list with search + status filter | [VERIFIED: app/Livewire/RequestList.php:11-18] |
| RequestForm | `app/Livewire/RequestForm.php` | Create/edit requests, submit for review | [VERIFIED: app/Livewire/RequestForm.php:10-22] |
| RequestDetail | `app/Livewire/RequestDetail.php` | View single request with nested components | [VERIFIED: app/Livewire/RequestDetail.php:8-15] |
| ApprovalActions | `app/Livewire/ApprovalActions.php` | Start review, approve, reject controls | [VERIFIED: app/Livewire/ApprovalActions.php:9-13] |
| CommentSection | `app/Livewire/CommentSection.php` | Add/view comments with visibility filter | [VERIFIED: app/Livewire/CommentSection.php:10-18] |
| Request model | `app/Models/Request.php` | Request entity + workflow methods | [VERIFIED: app/Models/Request.php:11-29] |
| User model | `app/Models/User.php` | User with role helpers | [VERIFIED: app/Models/User.php:9-15] |
| Comment model | `app/Models/Comment.php` | Comment entity + visibility rule | [VERIFIED: app/Models/Comment.php:8-14] |
| AuditLog model | `app/Models/AuditLog.php` | Activity logging (create-only) | [VERIFIED: app/Models/AuditLog.php:8-24] |
| RequestPolicy | `app/Policies/RequestPolicy.php` | view/update/delete/review authorization | [VERIFIED: app/Policies/RequestPolicy.php:8-13] |
| RequestStatusChanged | `app/Events/RequestStatusChanged.php` | Event carrying old + new status | [VERIFIED: app/Events/RequestStatusChanged.php:10-18] |
| SendStatusNotification | `app/Listeners/SendStatusNotification.php` | Writes audit log, logs "notifications" | [VERIFIED: app/Listeners/SendStatusNotification.php:11-23] |
| RequestStatus enum | `app/Enums/RequestStatus.php` | Status cases + transition guards | [VERIFIED: app/Enums/RequestStatus.php:5-12] |
| UserRole enum | `app/Enums/UserRole.php` | Role cases + permission helpers | [VERIFIED: app/Enums/UserRole.php:5-9] |

[NOT_FOUND: searched "NotificationBell", "UserProfile" in app/Livewire/ — only the five components listed above exist]

[NOT_FOUND: searched "Service" in app/ — no service classes; app/ contains only Enums, Events, Listeners, Livewire, Models, Policies. Business logic lives in models and Livewire components]

### Database Schema (summary — details belong in Data Models documentation)

| Table | Columns | Evidence |
|-------|---------|----------|
| users | id, name, email, role, timestamps | [VERIFIED: database/migrations/2024_01_01_000001_create_users_table.php:11-17] |
| requests | id, title, description, amount, requester_id, reviewer_id, status, submitted_at, reviewed_at, timestamps | [VERIFIED: database/migrations/2024_01_01_000002_create_requests_table.php:11-25] |
| comments | id, request_id, user_id, body, is_internal, timestamps | [VERIFIED: database/migrations/2024_01_01_000003_create_comments_table.php:11-20] |
| audit_logs | id, request_id, user_id, action, old_value, new_value, metadata, created_at | [VERIFIED: database/migrations/2024_01_01_000004_create_audit_logs_table.php:11-22] |

[NOT_FOUND: searched "attachments", "approval_chains", "notifications" in database/migrations/ — only the four tables above exist]

### Status Workflow

[VERIFIED: app/Enums/RequestStatus.php:5-12]
```php
enum RequestStatus: string
{
    case DRAFT = 'draft';
    case PENDING = 'pending';
    case UNDER_REVIEW = 'under_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';
```

Editing is only allowed in DRAFT or PENDING:

[VERIFIED: app/Enums/RequestStatus.php:41-44]
```php
    public function isEditable(): bool
    {
        return in_array($this, [self::DRAFT, self::PENDING]);
    }
```

The model delegates to the enum guard [VERIFIED: app/Models/Request.php:112-115]; reviewing is allowed from PENDING or UNDER_REVIEW [VERIFIED: app/Models/Request.php:120-124]. Transition writers: `submit()` sets PENDING [VERIFIED: app/Models/Request.php:74], `approve()` sets APPROVED [VERIFIED: app/Models/Request.php:87], `reject()` sets REJECTED [VERIFIED: app/Models/Request.php:101], and `startReview()` in the component sets UNDER_REVIEW [VERIFIED: app/Livewire/ApprovalActions.php:29-32].

[NOT_FOUND: searched "CANCELLED" in app/ — the enum defines CANCELLED but no code path assigns it; cancellation is not implemented]

### Role-Based Access

[VERIFIED: app/Enums/UserRole.php:5-9]
```php
enum UserRole: string
{
    case REQUESTER = 'requester';
    case REVIEWER = 'reviewer';
    case ADMIN = 'admin';
```

[VERIFIED: app/Enums/UserRole.php:23-26]
```php
    public function canApprove(): bool
    {
        return in_array($this, [self::REVIEWER, self::ADMIN]);
    }
```

`canViewAll()` grants reviewers/admins visibility of all requests [VERIFIED: app/Enums/UserRole.php:31-34]; the User model exposes both helpers [VERIFIED: app/Models/User.php:44-47, app/Models/User.php:52-55].

### Event System

[VERIFIED: app/Events/RequestStatusChanged.php:14-18]
```php
    public function __construct(
        public Request $request,
        public RequestStatus $oldStatus,
        public RequestStatus $newStatus,
    ) {}
```

Fired on every status transition, e.g. in `submit()`:

[VERIFIED: app/Models/Request.php:78]
```php
        event(new RequestStatusChanged($this, $oldStatus, $this->status));
```

The listener writes the audit log entry:

[VERIFIED: app/Listeners/SendStatusNotification.php:17-23]
```php
        // Log the status change
        AuditLog::logStatusChange(
            $request,
            Auth::user(),
            $event->oldStatus->value,
            $event->newStatus->value
        );
```

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|---------------|------|-----------------------------|----------|
| `GET /` | Web Route (full-page Livewire) | RequestList, Request model | [VERIFIED: routes/web.php:19] |
| `GET /requests/create` | Web Route | RequestForm, Request model | [VERIFIED: routes/web.php:22] |
| `GET /requests/{request}` | Web Route | RequestDetail, ApprovalActions, CommentSection | [VERIFIED: routes/web.php:25] |
| `GET /requests/{request}/edit` | Web Route | RequestForm | [VERIFIED: routes/web.php:28] |
| Livewire actions (`wire:submit` / `wire:click` / `wire:model.live`) | Livewire AJAX round-trip | RequestForm, ApprovalActions, CommentSection, RequestList | See §3b for the per-interaction map |

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input Type | Output Type | Participating Components |
|-------|------------|-------------|--------------------------|
| Request creation | Validated form fields | Request record (status `draft`) | RequestForm, Request model |
| Submission | Draft request | Pending request + RequestStatusChanged event | RequestForm, Request model |
| Review decision | Pending/under-review request | Approved or rejected request + event | ApprovalActions, Request model |
| Audit logging | RequestStatusChanged event | AuditLog record | SendStatusNotification, AuditLog model |
| Commenting | Comment form fields | Comment record + `commentAdded` event | CommentSection, Comment model |
| List/detail refresh | `requestUpdated` / `commentAdded` events | Re-rendered component HTML | RequestList, RequestDetail |

### 3.3 Pointers to Code Flow Documentation

Detailed execution paths are deliberately **not** traced here — see `02-code-flows.md` for:

- **Submit Request flow** — entry `RequestForm::submit()` [VERIFIED: app/Livewire/RequestForm.php:71-88]
- **Approve/Reject flow** — entry `ApprovalActions::approve()` / `reject()` [VERIFIED: app/Livewire/ApprovalActions.php:37-55, app/Livewire/ApprovalActions.php:68-85]
- **Add Comment flow** — entry `CommentSection::addComment()` [VERIFIED: app/Livewire/CommentSection.php:25-49]

---

## 3b. Frontend → Backend Interaction Map

Each row is a distinct frontend-triggered backend entry point (discovery only; behavior belongs in Code Flow documentation).

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|
| `request-list.blade.php` | `wire:model.live` | RequestList.php | `search` / `statusFilter` updates | [VERIFIED: resources/views/livewire/request-list.blade.php:6, 11] |
| `request-form.blade.php` | `wire:submit` | RequestForm.php | `save()` | [VERIFIED: resources/views/livewire/request-form.blade.php:2] |
| `request-form.blade.php` | `wire:click` | RequestForm.php | `submit()` | [VERIFIED: resources/views/livewire/request-form.blade.php:50] |
| `approval-actions.blade.php` | `wire:click` | ApprovalActions.php | `startReview()` | [VERIFIED: resources/views/livewire/approval-actions.blade.php:5] |
| `approval-actions.blade.php` | `wire:click` | ApprovalActions.php | `approve()` | [VERIFIED: resources/views/livewire/approval-actions.blade.php:9] |
| `approval-actions.blade.php` | `wire:click` | ApprovalActions.php | `openRejectModal()` / `closeRejectModal()` | [VERIFIED: resources/views/livewire/approval-actions.blade.php:12, 34] |
| `approval-actions.blade.php` | `wire:click` | ApprovalActions.php | `reject()` | [VERIFIED: resources/views/livewire/approval-actions.blade.php:37] |
| `comment-section.blade.php` | `wire:submit` | CommentSection.php | `addComment()` | [VERIFIED: resources/views/livewire/comment-section.blade.php:5] |

### Component-to-Component Events

RequestDetail's view nests the other two interactive components [VERIFIED: resources/views/livewire/request-detail.blade.php:40, 44]. They coordinate through Livewire events:

[VERIFIED: app/Livewire/RequestList.php:21]
```php
    protected $listeners = ['requestUpdated' => '$refresh'];
```

[VERIFIED: app/Livewire/RequestDetail.php:12-15]
```php
    protected $listeners = [
        'requestUpdated' => '$refresh',
        'commentAdded' => '$refresh',
    ];
```

[VERIFIED: app/Livewire/ApprovalActions.php:54]
```php
        $this->dispatch('requestUpdated');
```

[VERIFIED: app/Livewire/CommentSection.php:46]
```php
        $this->dispatch('commentAdded');
```

---

## 4. File/Folder Conventions

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| `app/Livewire/*.php` | One class per page or nested component | [VERIFIED: app/Livewire/RequestList.php:11, app/Livewire/RequestDetail.php:8] |
| `resources/views/livewire/*.blade.php` | Kebab-case Blade view per component, resolved via `view('livewire.request-list', ...)` | [VERIFIED: app/Livewire/RequestList.php:60, app/Livewire/RequestForm.php:92] |
| `app/Models/` | Eloquent models carrying workflow methods | [VERIFIED: app/Models/Request.php:11, app/Models/User.php:9] |
| `app/Enums/` | Backed enums for status and role | [VERIFIED: app/Enums/RequestStatus.php:5, app/Enums/UserRole.php:5] |
| `app/Events/` + `app/Listeners/` | One event + one listener pair for status changes | [VERIFIED: app/Events/RequestStatusChanged.php:10, app/Listeners/SendStatusNotification.php:11] |
| `app/Policies/` | Authorization rules per model | [VERIFIED: app/Policies/RequestPolicy.php:8] |
| `database/migrations/` | Four dated migrations, one table each | [VERIFIED: database/migrations/2024_01_01_000001_create_users_table.php:11, database/migrations/2024_01_01_000004_create_audit_logs_table.php:11] |
| `routes/web.php` | All routes map directly to Livewire component classes | [VERIFIED: routes/web.php:19-28] |

---

## 5. External Dependencies

| Dependency | Purpose | Evidence |
|------------|---------|----------|
| `laravel/framework` ^10.0 | Application framework | [VERIFIED: composer.json:6] |
| `livewire/livewire` ^3.0 | Reactive server-rendered components | [VERIFIED: composer.json:7] |
| `laravel/pint` ^1.0 (dev) | Code style | [VERIFIED: composer.json:10] |

[NOT_FOUND: searched "Http::", "env(" in app/ — no outbound HTTP calls and no environment-driven service configuration]

[NOT_FOUND: searched "pusher", "redis", "sanctum" in approval-flow/ — no real-time, cache/queue, or API-auth dependencies declared]

---

## 6. Known Issues & Risks

### 6.1 Business Logic Duplication

[VERIFIED: app/Models/Request.php:68]
```php
        // Wart: Business rule check duplicated in Livewire component
```

The same editable check appears in the model and the form component [VERIFIED: app/Models/Request.php:112-115, app/Livewire/RequestForm.php:41-44].

### 6.2 Role Check Duplication

[VERIFIED: app/Livewire/RequestList.php:40]
```php
        // Wart: This logic duplicated in RequestPolicy
```

The same view-permission logic appears in the component query and the policy [VERIFIED: app/Livewire/RequestList.php:41-43, app/Policies/RequestPolicy.php:21-22].

### 6.3 Rejection Reason Collected But Never Saved

[VERIFIED: app/Livewire/ApprovalActions.php:77-78]
```php
        // Wart: Rejection reason not actually saved anywhere
        // Should create a comment with the reason
```

The reject modal binds a `rejectionReason` textarea that is discarded [VERIFIED: resources/views/livewire/approval-actions.blade.php:26-31, app/Livewire/ApprovalActions.php:62-66].

### 6.4 Notifications Are Log Lines Only

[VERIFIED: app/Listeners/SendStatusNotification.php:35-40]
```php
    private function notifyReviewers($request): void
    {
        // Wart: Should get all reviewers and notify them
        // Currently just logs
        Log::info("New request pending review: {$request->id}");
    }
```

### 6.5 Comments Bypass the Audit Trail

[VERIFIED: app/Livewire/CommentSection.php:48]
```php
        // Wart: Should also log to audit trail
```

### 6.6 Features Confirmed Absent

- [NOT_FOUND: searched "pusher", "redis", "broadcast", "websocket" in approval-flow/ — no real-time updates]
- [NOT_FOUND: searched "attachment", "upload", "approval_chain" in approval-flow/ — no file attachments, no multi-level approval; single reviewer only]
- [NOT_FOUND: searched "Mail::", "Notification::", "sms" in app/ — no email/SMS delivery; the listener only writes log lines]
- [NOT_FOUND: searched "alpine", "x-data", "tailwind" in approval-flow/ — no Alpine.js, no CSS framework; views use plain CSS classes]
- [NOT_FOUND: searched "Route::post", "api" in routes/ — no POST or API endpoints; all four routes are GET Livewire pages]

---

## 7. Entry Points Summary

| Route/Entry | Method | Handler | Middleware | Verified |
|-------------|--------|---------|------------|----------|
| `/` | GET | `RequestList::class` | see note below | [VERIFIED: routes/web.php:19] |
| `/requests/create` | GET | `RequestForm::class` | see note below | [VERIFIED: routes/web.php:22] |
| `/requests/{request}` | GET | `RequestDetail::class` | see note below | [VERIFIED: routes/web.php:25] |
| `/requests/{request}/edit` | GET | `RequestForm::class` | see note below | [VERIFIED: routes/web.php:28] |

Middleware note: the routes file comment says authentication is "applied in RouteServiceProvider" [VERIFIED: routes/web.php:14], but that provider is not part of this example. [NOT_FOUND: searched "RouteServiceProvider", "middleware" in approval-flow/ — no provider or middleware definitions exist here]

[ASSUMED: components call Auth::user() throughout (e.g. app/Livewire/RequestList.php:35), so a standard Laravel auth guard is assumed to be configured by the host application]

---

## 8. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| Backend Framework | Laravel 10 | [VERIFIED: composer.json:6] |
| Frontend Framework | Livewire 3 | [VERIFIED: composer.json:7] |
| Primary Database | Driver-agnostic (migrations use the Schema builder) | [INFERRED: Schema::create in all four migrations; no DB driver named anywhere in the example] |
| Authentication | Not included in example (see §7 note) | `[ASSUMED]` above |
| External Services | None | [NOT_FOUND: searched "Http::", "guzzle", "api_key" in approval-flow/ — no external service integration] |

---

## Why This Example is GOOD

1. **Every claim is cited or admitted.** Each factual statement carries a `[VERIFIED: path:line]` tag that resolves against `examples/livewire/approval-flow/`, or an explicit `[NOT_FOUND]` / `[ASSUMED]` / `[INFERRED]` admission.
2. **Quotes are exact copy-paste.** Every fenced block matches the cited line range character-for-character, so `verify.py` phase 2 passes.
3. **Absence is documented with real searches.** The `[NOT_FOUND]` items name the patterns searched (Pusher, services, attachments, Alpine.js...), so a reader can re-run them.
4. **Section 3 stays at discovery level.** Tables describe entry surfaces and what moves — no step-by-step traces, no arrow diagrams; detailed tracing is deferred to `02-code-flows.md`.
5. **The Frontend → Backend map uses complete, resolvable paths.** Blade sources are cited as `resources/views/livewire/...blade.php:line`, not bare filenames.
6. **Warts are surfaced, not hidden.** Duplicated business rules, the discarded rejection reason, and log-only notifications are documented with the exact comment lines.
7. **It is machine-checkable.** Running the command in the metadata block exits 0.
