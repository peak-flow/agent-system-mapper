# TaskTracker Architecture Overview

> ⚠️ **BAD EXAMPLE — DO NOT IMITATE.** This document demonstrates hallucination patterns. Each ❌ callout explains a failure. See good-architecture-doc-example.md for the correct approach.

## What This System Does

TaskTracker is a comprehensive project management API built with FastAPI. It allows users to create projects, manage tasks, assign work to team members, and track progress with notifications.

> **❌ PROBLEMS:** Pure uncited prose. No metadata block (commit, path, date), no verification summary, and not a single verification tag in the entire document. "Comprehensive" is marketing language, and "track progress with notifications" oversells reality — the only notification mechanism is a single outbound webhook (`app/services/notification_service.py:43-59`). A reader has no way to check any of this.

## Components

### API Layer
The system uses FastAPI routers to handle HTTP requests. Each resource has its own router:
- Users router handles user CRUD operations
- Projects router manages project lifecycle
- Tasks router handles task management with status updates

> **❌ PROBLEMS:** This is the trap of *plausible* hallucination — these routers happen to exist (`app/api/users.py:12`, `app/api/projects.py:13`, `app/api/tasks.py:13`), but nothing here is cited, so the reader cannot tell this section apart from the fabricated ones below. Uncited-but-true is indistinguishable from uncited-and-false.

### Database Layer
Uses SQLAlchemy ORM with async support for high-performance database operations. The models are well-structured with proper relationships:
- User has many Projects and Tasks
- Project has many Tasks
- Task belongs to Project and User

> **❌ PROBLEMS:** "Async support" is fabricated. The engine is created with the synchronous `create_engine` (`app/core/database.py:11-14`) and a plain `sessionmaker` (`app/core/database.py:16`); every route handler is a sync `def`, not `async def` (e.g. `app/api/tasks.py:17`). "High-performance" is unfounded editorializing — the code itself flags "No connection pooling configured" (`app/core/database.py:10`). The relationship bullets are roughly right (`app/models/user.py:22-23`) but carry no citations, so they add no verifiable information.

### Service Layer
Business logic is handled by services:
- TaskService handles task creation with notifications
- ProjectService handles project operations
- UserService manages user authentication
- NotificationService sends emails and push notifications

> **❌ PROBLEMS:** Half of this service roster is invented by naming symmetry. Only two services exist: `TaskService` (`app/services/task_service.py:14`) and `NotificationService` (`app/services/notification_service.py:13`). There is no `ProjectService` and no `UserService` — `app/services/` contains exactly `task_service.py`, `notification_service.py`, and `__init__.py`. "UserService manages user authentication" is doubly false: the class doesn't exist and neither does authentication. And `NotificationService` sends neither emails nor push notifications — it POSTs a JSON webhook via httpx (`app/services/notification_service.py:43-59`).

### Authentication
The API uses JWT authentication with refresh tokens. Users authenticate via the /auth/login endpoint and receive access tokens.

> **❌ PROBLEMS:** This entire section is fabricated. Searches for "jwt", "token", "login", and "auth" in `app/` and `main.py` return nothing. The only mounted routers are `/users`, `/projects`, and `/tasks` (`main.py:19-21`) plus `GET /health` (`main.py:24-25`) — there is no `/auth/login` endpoint and every endpoint is completely open. A good doc states this as a `[NOT_FOUND]` with the search terms; this doc invents the opposite.

## Data Flow

1. Request comes in through FastAPI router
2. Pydantic validates the request body
3. Dependency injection provides database session
4. Service layer processes business logic
5. Repository layer handles database operations
6. Response is serialized via Pydantic models

> **❌ PROBLEMS:** Step-by-step execution tracing is a banned pattern in an architecture overview — prompt 01's Section 3 rules say "MUST NOT trace step-by-step execution"; detailed traces belong in the code-flows document. An architecture doc describes surfaces and what moves in tables (see Section 3 of the good example). This numbered walkthrough is also generic FastAPI boilerplate that would "document" any FastAPI app equally well, and it silently assumes every request goes through a service layer — in reality only the task routes use `TaskService` (`app/api/tasks.py:105`, `app/api/tasks.py:125`); user and project routes call repositories directly (`app/api/users.py:18`, `app/api/projects.py:19`).

## External Integrations

- **Email Service**: Sends transactional emails via SendGrid
- **Push Notifications**: Uses Firebase Cloud Messaging
- **Webhook System**: Notifies external services of task events
- **Redis Cache**: Caches frequently accessed data

> **❌ PROBLEMS:** Three of these four integrations do not exist. Searches for "sendgrid", "smtp", "firebase", "redis", and "cache" in `app/` return nothing. The only real integration is the webhook (`app/services/notification_service.py:43-59`), configured by `NOTIFICATION_WEBHOOK_URL` and `NOTIFICATION_ENABLED` (`app/core/config.py:17-18`). One true bullet buried in three hallucinated ones is worse than useless — the reader cannot tell which is which.

## Key Patterns

- Repository pattern for data access
- Dependency injection via FastAPI's Depends
- Async/await for non-blocking operations
- Pydantic models for validation

> **❌ PROBLEMS:** "Async/await for non-blocking operations" is false — there is not a single `async def` in `app/` or `main.py`; the notification path even uses a blocking `httpx.Client` (`app/services/notification_service.py:54`). The other three bullets are real (`app/repositories/task_repository.py:11`, `app/api/users.py:16`, `app/schemas/task.py:10`) but uncited, repeating the pattern of mixing verifiable truth and fabrication with no way to distinguish them.

## Database Schema

| Table | Description |
|-------|-------------|
| users | User accounts with email and password |
| projects | Projects owned by users |
| tasks | Tasks within projects |
| notifications | Notification queue |
| audit_log | Tracks all changes |

> **❌ PROBLEMS:** Two of five tables are invented. Only three models declare `__tablename__`: users (`app/models/user.py:14`), projects (`app/models/project.py:22`), and tasks (`app/models/task.py:30`). There is no `notifications` table and no `audit_log` table — `app/models/` contains only `user.py`, `project.py`, `task.py`, and `__init__.py`. The users row is also wrong in detail: the User model has no password column, only id, email, name, and created_at (`app/models/user.py:16-19`) — consistent with the fact that no authentication exists.

---

## Why This Example is BAD

Each numbered item pairs the false claim with the verifiable reality in `examples/fastapi/tasktracker/`:

1. **"JWT authentication with refresh tokens" and a `/auth/login` endpoint** → No authentication of any kind exists. The only mounted routers are `/users`, `/projects`, `/tasks` (`main.py:19-21`) plus `GET /health` (`main.py:24-25`); searches for "jwt", "token", "login", "auth" in `app/` return nothing.
2. **"SQLAlchemy ORM with async support"** → The database layer is synchronous: `create_engine` (`app/core/database.py:11-14`), `sessionmaker` (`app/core/database.py:16`), and sync `def` handlers throughout (e.g. `app/api/tasks.py:17`).
3. **Service roster of TaskService, ProjectService, UserService, NotificationService** → Only `TaskService` (`app/services/task_service.py:14`) and `NotificationService` (`app/services/notification_service.py:13`) exist; `ProjectService` and `UserService` are invented.
4. **"Sends transactional emails via SendGrid" and "Firebase Cloud Messaging" push** → `NotificationService` only POSTs a JSON webhook with httpx (`app/services/notification_service.py:43-59`); no email or push code exists anywhere.
5. **"Redis Cache: Caches frequently accessed data"** → No caching layer; searches for "redis" and "cache" in `app/` return nothing.
6. **users table with "email and password"** → The User model has no password column: id, email, name, created_at only (`app/models/user.py:16-19`).
7. **`notifications` and `audit_log` tables** → Do not exist; the only tables are users (`app/models/user.py:14`), projects (`app/models/project.py:22`), and tasks (`app/models/task.py:30`).
8. **Step-by-step "Data Flow" section** → A banned pattern in the architecture overview (prompt 01 Section 3: "MUST NOT trace step-by-step execution"); detailed tracing belongs in the code-flows document, and Section 3 of the good example shows the table-based alternative.
9. **Zero verification tags** → Not one `[VERIFIED: path:line]` or `[NOT_FOUND]` in the whole document, so nothing is checkable — `verify.py` finds no citations to resolve, and every claim (true or false) reads identically. Cite or admit; there is no middle ground.
