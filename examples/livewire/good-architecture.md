# ApprovalFlow Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/livewire/approval-flow/` |
| Commit | `5d83fc5` |
| Documented | `2025-12-21` |
| Verification Status | `Verified` |

## Verification Summary
- [VERIFIED]: 42 claims
- [INFERRED]: 3 claims
- [NOT_FOUND]: 8 items (Alpine.js, Pusher, Redis, PDF, SMS, OAuth, attachments, approval chains)
- [ASSUMED]: 1 item (Laravel conventions)

---

## System Classification
| Field | Value |
|-------|-------|
| Type | Laravel Livewire hybrid (server-rendered with reactive components) |
| Evidence | `composer.json` with `livewire/livewire`, `app/Livewire/` components |
| Confidence | `[VERIFIED]` |

---

## System Purpose

ApprovalFlow is a **multi-step approval workflow system** for managing requests that require review and approval.

[VERIFIED: `composer.json:6-7`]
```json
"laravel/framework": "^10.0",
"livewire/livewire": "^3.0"
```

Key features:
- Submit requests for approval [VERIFIED: `app/Models/Request.php:64-75`]
- Role-based review permissions [VERIFIED: `app/Enums/UserRole.php`]
- Multi-status workflow [VERIFIED: `app/Enums/RequestStatus.php`]
- Comments with internal/public visibility [VERIFIED: `app/Models/Comment.php`]
- Audit trail [VERIFIED: `app/Models/AuditLog.php`]

---

## Component Map

| Component | Location | Responsibility | Verified |
|-----------|----------|----------------|----------|
| RequestList | `app/Livewire/RequestList.php` | Paginated list with filters | [VERIFIED] |
| RequestForm | `app/Livewire/RequestForm.php` | Create/edit requests | [VERIFIED] |
| RequestDetail | `app/Livewire/RequestDetail.php` | View single request | [VERIFIED] |
| ApprovalActions | `app/Livewire/ApprovalActions.php` | Approve/reject controls | [VERIFIED] |
| CommentSection | `app/Livewire/CommentSection.php` | Add/view comments | [VERIFIED] |
| Request model | `app/Models/Request.php` | Request entity + workflow | [VERIFIED] |
| User model | `app/Models/User.php` | User with role | [VERIFIED] |
| Comment model | `app/Models/Comment.php` | Comment entity | [VERIFIED] |
| AuditLog model | `app/Models/AuditLog.php` | Activity logging | [VERIFIED] |
| RequestPolicy | `app/Policies/RequestPolicy.php` | Authorization rules | [VERIFIED] |

[NOT_FOUND: searched "NotificationBell", "UserProfile" in app/Livewire/]
No NotificationBell or UserProfile components.

[NOT_FOUND: searched "Service" in app/]
No service classes - business logic is in models and Livewire components.

---

## Livewire Component Architecture

### Component Communication

Components communicate via Livewire events:

[VERIFIED: `app/Livewire/RequestList.php:18`]
```php
protected $listeners = ['requestUpdated' => '$refresh'];
```

[VERIFIED: `app/Livewire/ApprovalActions.php:45`]
```php
$this->dispatch('requestUpdated');
```

[VERIFIED: `app/Livewire/RequestDetail.php:12-15`]
```php
protected $listeners = [
    'requestUpdated' => '$refresh',
    'commentAdded' => '$refresh',
];
```

### Component Hierarchy (on detail page)

```
RequestDetail
├── ApprovalActions (emits: requestUpdated)
└── CommentSection (emits: commentAdded)
```

---

## Status Workflow

[VERIFIED: `app/Enums/RequestStatus.php:5-11`]
```php
enum RequestStatus: string
{
    case DRAFT = 'draft';
    case PENDING = 'pending';
    case UNDER_REVIEW = 'under_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';
}
```

Workflow transitions:
```
DRAFT → PENDING (submit)
PENDING → UNDER_REVIEW (reviewer starts)
UNDER_REVIEW → APPROVED | REJECTED (reviewer decides)
DRAFT | PENDING → CANCELLED (requester cancels)
```

[VERIFIED: `app/Models/Request.php:103-107`]
```php
public function canEdit(): bool
{
    return $this->status->isEditable();
}
```

[VERIFIED: `app/Enums/RequestStatus.php:38-41`]
```php
public function isEditable(): bool
{
    return in_array($this, [self::DRAFT, self::PENDING]);
}
```

---

## Role-Based Access

[VERIFIED: `app/Enums/UserRole.php:5-9`]
```php
enum UserRole: string
{
    case REQUESTER = 'requester';
    case REVIEWER = 'reviewer';
    case ADMIN = 'admin';
}
```

Permissions:

[VERIFIED: `app/Enums/UserRole.php:22-25`]
```php
public function canApprove(): bool
{
    return in_array($this, [self::REVIEWER, self::ADMIN]);
}
```

[VERIFIED: `app/Enums/UserRole.php:30-33`]
```php
public function canViewAll(): bool
{
    return in_array($this, [self::REVIEWER, self::ADMIN]);
}
```

---

## Frontend → Backend Interaction Map

| Frontend Source | Trigger Type | Backend Target | Handler / Method | Evidence |
|-----------------|--------------|----------------|------------------|----------|
| request-list.blade.php | wire:model.live | RequestList.php | search/filter | [VERIFIED:request-list.blade.php:5-6] |
| request-form.blade.php | wire:submit | RequestForm.php | save() | [VERIFIED:request-form.blade.php:2] |
| request-form.blade.php | wire:click | RequestForm.php | submit() | [VERIFIED:request-form.blade.php:45] |
| approval-actions.blade.php | wire:click | ApprovalActions.php | approve() | [VERIFIED:approval-actions.blade.php:10] |
| approval-actions.blade.php | wire:click | ApprovalActions.php | reject() | [VERIFIED:approval-actions.blade.php:29] |
| comment-section.blade.php | wire:submit | CommentSection.php | addComment() | [VERIFIED:comment-section.blade.php:3] |

---

## Event System

[VERIFIED: `app/Events/RequestStatusChanged.php:10-15`]
```php
public function __construct(
    public Request $request,
    public RequestStatus $oldStatus,
    public RequestStatus $newStatus,
) {}
```

Fired when status changes:
[VERIFIED: `app/Models/Request.php:74`]
```php
event(new RequestStatusChanged($this, $oldStatus, $this->status));
```

Listener creates audit log:
[VERIFIED: `app/Listeners/SendStatusNotification.php:17-23`]
```php
public function handle(RequestStatusChanged $event): void
{
    // Log the status change
    AuditLog::logStatusChange(
        $request,
        Auth::user(),
        $event->oldStatus->value,
        $event->newStatus->value
    );
```

---

## Database Schema

| Table | Columns | Source |
|-------|---------|--------|
| users | id, name, email, role, timestamps | [VERIFIED: migrations/000001] |
| requests | id, title, description, amount, requester_id, reviewer_id, status, submitted_at, reviewed_at, timestamps | [VERIFIED: migrations/000002] |
| comments | id, request_id, user_id, body, is_internal, timestamps | [VERIFIED: migrations/000003] |
| audit_logs | id, request_id, user_id, action, old_value, new_value, metadata, created_at | [VERIFIED: migrations/000004] |

[NOT_FOUND: searched "attachments", "approval_chains" in migrations/]
No attachments or approval_chains tables.

---

## Known Issues / Warts

### 1. Business Logic Duplication

[VERIFIED: `app/Models/Request.php:65`]
```php
// Wart: Business rule check duplicated in Livewire component
```

Same editable check appears in:
- `app/Models/Request.php:103-106`
- `app/Livewire/RequestForm.php:41-45`

### 2. Role Check Duplication

[VERIFIED: `app/Livewire/RequestList.php:34`]
```php
// Wart: This logic duplicated in RequestPolicy
```

Same view permission logic in:
- `app/Livewire/RequestList.php:35-37`
- `app/Policies/RequestPolicy.php:17-22`

### 3. Rejection Reason Not Saved

[VERIFIED: `app/Livewire/ApprovalActions.php:71-72`]
```php
// Wart: Rejection reason not actually saved anywhere
// Should create a comment with the reason
```

### 4. Notifications Not Implemented

[VERIFIED: `app/Listeners/SendStatusNotification.php:36-38`]
```php
private function notifyReviewers($request): void
{
    // Wart: Should get all reviewers and notify them
    // Currently just logs
    Log::info("New request pending review: {$request->id}");
}
```

### 5. Comment Audit Missing

[VERIFIED: `app/Livewire/CommentSection.php:42`]
```php
// Wart: Should also log to audit trail
```

---

## Entry Points

[VERIFIED: `routes/web.php:16-23`]

| Route | Method | Handler | Verified |
|-------|--------|---------|----------|
| `/` | GET | RequestList::class | [VERIFIED] |
| `/requests/create` | GET | RequestForm::class | [VERIFIED] |
| `/requests/{request}` | GET | RequestDetail::class | [VERIFIED] |
| `/requests/{request}/edit` | GET | RequestForm::class | [VERIFIED] |

---

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Backend Framework | Laravel 10 [VERIFIED: composer.json] |
| Frontend Framework | Livewire 3 [VERIFIED: composer.json] |
| Database | SQLite/MySQL (via Laravel) [INFERRED: migrations use Schema] |
| Authentication | Laravel built-in [ASSUMED: standard Laravel] |

[NOT_FOUND: searched "alpine", "tailwind" in approval-flow/]
No Alpine.js or TailwindCSS configuration found - views use plain CSS classes.

[NOT_FOUND: searched "redis", "pusher" in approval-flow/]
No real-time infrastructure configured.

---

## What This System Does NOT Have

Based on searches finding no results:

1. **No Real-time Updates** - No Pusher/WebSockets
2. **No Service Layer** - Logic in models and components
3. **No File Attachments** - No upload functionality
4. **No Multi-level Approval** - Single reviewer only
5. **No Email/SMS Notifications** - Just logging
6. **No Alpine.js** - Pure Livewire
7. **No CSS Framework** - Plain CSS classes
8. **No API Endpoints** - Web routes only
