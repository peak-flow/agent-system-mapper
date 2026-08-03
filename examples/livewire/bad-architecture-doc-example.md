# ApprovalFlow Architecture Overview

> ⚠️ **BAD EXAMPLE — DO NOT IMITATE.** This document demonstrates hallucination patterns. Each ❌ callout explains a failure. See good-architecture-doc-example.md for the correct approach.

## What This System Does

ApprovalFlow is a comprehensive multi-step approval workflow system built with Laravel Livewire. It handles expense requests, content moderation, and internal change requests with full role-based access control.

> **❌ PROBLEMS:** No citations, and the scope is invented. There is one generic `Request` model with `title`, `description`, `amount` fields (`app/Models/Request.php:13-22`) and no request-type column in the schema (`database/migrations/2024_01_01_000002_create_requests_table.php:11-25`) — "content moderation" and "internal change requests" do not exist anywhere in the code. "Multi-step" is also wrong: a single reviewer approves or rejects (`app/Models/Request.php:84-107`); there are no approval chains.

## Technology Stack

- Laravel 10 with Livewire 3
- Alpine.js for client-side interactions
- TailwindCSS for styling
- MySQL database
- Redis for caching and queue
- Pusher for real-time updates

> **❌ PROBLEMS:** Four of six items are hallucinated from framework habit. `composer.json:4-11` declares only `php`, `laravel/framework`, `livewire/livewire`, and `laravel/pint` — there is no Alpine.js, no TailwindCSS, no Redis, no Pusher, and no `package.json` at all. Views use plain CSS classes (`resources/views/livewire/request-list.blade.php:3-8`). The migrations use the driver-agnostic Schema builder; MySQL is never named. A good doc would write `[NOT_FOUND: searched "alpine", "tailwind", "redis", "pusher"]` for each.

## Components

### Livewire Components
- RequestList - Paginated list with filters and real-time updates
- RequestForm - Create/edit form with validation
- RequestDetail - Full request view with all related data
- ApprovalActions - Approve/reject buttons with confirmation
- CommentSection - Threaded comments with real-time updates
- NotificationBell - Real-time notification dropdown
- UserProfile - User settings and preferences

> **❌ PROBLEMS:** `NotificationBell` and `UserProfile` do not exist — `app/Livewire/` contains exactly five classes: `ApprovalActions.php`, `CommentSection.php`, `RequestDetail.php`, `RequestForm.php`, `RequestList.php`. "Real-time updates" is false everywhere it appears: components refresh only via Livewire `$listeners` after a user action (`app/Livewire/RequestList.php:21`), not via push. Comments are flat, not threaded — there is no parent/reply column (`database/migrations/2024_01_01_000003_create_comments_table.php:11-20`). And "with confirmation" is only half true: reject opens a modal (`resources/views/livewire/approval-actions.blade.php:20-43`) but approve fires immediately (`resources/views/livewire/approval-actions.blade.php:9-11`).

### Services
- ApprovalService - Orchestrates the approval workflow
- NotificationService - Sends emails, SMS, and push notifications
- AuditService - Tracks all system changes
- PDFService - Generates approval certificates

> **❌ PROBLEMS:** The entire service layer is hallucinated. `app/` contains only `Enums`, `Events`, `Listeners`, `Livewire`, `Models`, `Policies` — there is no `app/Services/` directory and none of these four classes exist. Approval logic lives in the model (`app/Models/Request.php:84-107`), audit writing in `AuditLog::logStatusChange` (`app/Models/AuditLog.php:54-67`) called from the listener (`app/Listeners/SendStatusNotification.php:18-23`), and "notifications" are `Log::info` stubs (`app/Listeners/SendStatusNotification.php:35-40`). Nothing generates PDFs.

### Jobs
- SendApprovalNotification - Queued email sending
- GenerateReportJob - Weekly summary reports
- CleanupOldRequests - Archive old completed requests

> **❌ PROBLEMS:** There is no `app/Jobs/` directory and no queued job anywhere in the example. All three classes are invented. The only queue-adjacent code is the `SerializesModels` trait import on the event (`app/Events/RequestStatusChanged.php:8`), which proves nothing about queues being used.

## Data Flow

1. User creates request via Livewire form
2. Request saved to database with draft status
3. User submits for review
4. Reviewers notified via Pusher
5. Reviewer approves/rejects
6. Requester notified of outcome
7. PDF certificate generated if approved

> **❌ PROBLEMS:** Two failures at once. First, a numbered step-by-step trace belongs in code-flow documentation, not an architecture overview — the methodology requires tables describing what moves, not execution steps. Second, steps 4, 6, and 7 are false: "notification" is a log line, `Log::info("New request pending review: ...")` (`app/Listeners/SendStatusNotification.php:39`) and `Log::info("Request {id} was {action}")` (`app/Listeners/SendStatusNotification.php:46`); no Pusher exists; nothing generates a PDF certificate.

## Authentication

Uses Laravel Sanctum with:
- Multi-factor authentication
- Session-based web auth
- API tokens for mobile app
- OAuth for SSO integration

> **❌ PROBLEMS:** Entirely fabricated. `composer.json:4-11` does not include Sanctum, and there is no MFA, token, or OAuth code anywhere. The example only calls the `Auth` facade (e.g. `app/Livewire/ApprovalActions.php:22`) and the routes file comment defers auth to a `RouteServiceProvider` that is not part of this example (`routes/web.php:14`). There is no mobile app and no API route (`routes/web.php:19-28` defines four GET web routes only).

## Real-time Features

- Live updates when request status changes
- Real-time comment notifications
- Presence indicators showing who's viewing
- Typing indicators in comments

> **❌ PROBLEMS:** None of this exists. Searching the whole app for "pusher", "broadcast", "websocket", "presence", "typing" finds nothing. Updates happen only when a component dispatches a Livewire event during a user's own request cycle (`app/Livewire/ApprovalActions.php:54`, `app/Livewire/CommentSection.php:46`) and siblings re-render via `$refresh` listeners (`app/Livewire/RequestDetail.php:12-15`). No other browser is ever notified.

## Database Schema

| Table | Description |
|-------|-------------|
| users | User accounts with roles |
| requests | Approval requests |
| comments | Request comments |
| audit_logs | All system changes |
| notifications | User notifications |
| attachments | File uploads |
| approval_chains | Multi-level approval rules |

> **❌ PROBLEMS:** The last three tables are invented. `database/migrations/` contains exactly four migrations: `2024_01_01_000001_create_users_table.php`, `..._000002_create_requests_table.php`, `..._000003_create_comments_table.php`, `..._000004_create_audit_logs_table.php`. There are no `notifications`, `attachments`, or `approval_chains` tables — padding a schema table with plausible-sounding rows is exactly the hallucination the methodology exists to prevent.

## Why This Example is BAD

1. **No metadata, no commit hash, no verification tags anywhere** — not a single claim carries `[VERIFIED: path:line]`, so nothing can be checked and `verify.py` has nothing to verify. → The good example resolves 104/104 citations.
2. **Invented technology stack**: Alpine.js, TailwindCSS, MySQL, Redis, Pusher → reality: `composer.json:4-11` declares only Laravel, Livewire, and Pint; no JS dependency file exists.
3. **Invented components**: NotificationBell, UserProfile → reality: five component classes in `app/Livewire/` (`RequestList.php:11`, `RequestForm.php:10`, `RequestDetail.php:8`, `ApprovalActions.php:9`, `CommentSection.php:10`).
4. **Invented service layer**: ApprovalService, NotificationService, AuditService, PDFService → reality: no `app/Services/`; logic sits in models (`app/Models/Request.php:66-107`) and the listener (`app/Listeners/SendStatusNotification.php:13-33`).
5. **Invented jobs**: SendApprovalNotification, GenerateReportJob, CleanupOldRequests → reality: no `app/Jobs/` directory exists.
6. **False notification claims**: "Reviewers notified via Pusher", emails/SMS → reality: log lines only (`app/Listeners/SendStatusNotification.php:39`, `app/Listeners/SendStatusNotification.php:46`), acknowledged by the wart comment at `app/Listeners/SendStatusNotification.php:26`.
7. **Invented authentication**: Sanctum, MFA, API tokens, OAuth → reality: bare `Auth::user()` calls (`app/Livewire/RequestList.php:35`) and a comment pointing at a provider that isn't in the example (`routes/web.php:14`).
8. **Invented real-time features**: live updates, presence, typing indicators → reality: request-cycle Livewire events only (`app/Livewire/ApprovalActions.php:54`).
9. **Padded database schema**: notifications, attachments, approval_chains tables → reality: four migrations only (`database/migrations/2024_01_01_000001_create_users_table.php` through `..._000004_create_audit_logs_table.php`).
10. **Step-by-step "Data Flow" trace in an architecture doc** — execution tracing belongs in code-flow documentation; the overview must stay at discovery level (tables, not numbered steps).
11. **No `[NOT_FOUND]` admissions** — a trustworthy doc records what it searched for and failed to find; this one asserts instead of admitting.
