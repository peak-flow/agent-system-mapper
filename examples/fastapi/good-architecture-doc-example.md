# TaskTracker Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/fastapi/tasktracker/` |
| Commit | `9a69c14` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

Verify with:

```bash
python3 verify.py examples/fastapi/good-architecture-doc-example.md --repo-root examples/fastapi/tasktracker
```

## Verification Summary
- `[VERIFIED]`: 77 claims (104 file:line citations, all resolving)
- `[INFERRED]`: 2 claims
- `[NOT_FOUND]`: 11 items (auth, email delivery, redis/cache, audit/notification tables, async DB, middleware, frontend assets, CLI entry points, migrations, unpinned httpx x2)
- `[ASSUMED]`: 0 items

These counts are transcribed from the `Tag counts` line that `verify.py` prints for this document.

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | Framework backend (FastAPI REST API) |
| Evidence | `fastapi==0.104.1` pinned [VERIFIED: requirements.txt:1]; app constructed via `FastAPI(...)` [VERIFIED: main.py:12] |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` |

---

## 1. System Purpose

TaskTracker is a small task- and project-management REST API built with FastAPI. It exposes open (unauthenticated) CRUD endpoints for users, projects, and tasks, enforces a per-project task limit, and emits webhook notifications when tasks are created or completed.

[VERIFIED: main.py:12-16]
```python
app = FastAPI(
    title="TaskTracker API",
    description="Simple task and project management API",
    version="1.0.0"
)
```

One router exists per resource: users [VERIFIED: app/api/users.py:12], projects [VERIFIED: app/api/projects.py:13], and tasks [VERIFIED: app/api/tasks.py:13].

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| FastAPI app | `main.py` | App construction, router mounting, `/health` endpoint | [VERIFIED: main.py:12-27] |
| API routers | `app/api/` | HTTP handlers for users, projects, tasks | [VERIFIED: app/api/users.py:12, app/api/projects.py:13, app/api/tasks.py:13] |
| SQLAlchemy models | `app/models/` | `User`, `Project`, `Task` ORM entities | [VERIFIED: app/models/user.py:11, app/models/project.py:19, app/models/task.py:27] |
| Pydantic schemas | `app/schemas/` | Request/response validation DTOs | [VERIFIED: app/schemas/user.py:9, app/schemas/project.py:10, app/schemas/task.py:10] |
| Repositories | `app/repositories/` | Data access layer around the ORM | [VERIFIED: app/repositories/user_repository.py:11, app/repositories/project_repository.py:11, app/repositories/task_repository.py:11] |
| Services | `app/services/` | Business logic and webhook notifications | [VERIFIED: app/services/task_service.py:14, app/services/notification_service.py:13] |
| Config | `app/core/config.py` | Env-driven settings singleton | [VERIFIED: app/core/config.py:10-24] |
| Database | `app/core/database.py` | Engine, session factory, `get_db` dependency | [VERIFIED: app/core/database.py:11-30] |

### Service Wiring

`TaskService` composes the repositories and the notification service via plain constructor injection:

[VERIFIED: app/services/task_service.py:20-24]
```python
    def __init__(self, db: Session):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)
        self.notification_service = NotificationService()
```

### Domain Entities

| Entity | Table | Key Columns | Evidence |
|--------|-------|-------------|----------|
| `User` | `users` | id, email, name, created_at | [VERIFIED: app/models/user.py:14-19] |
| `Project` | `projects` | id, name, description, status, owner_id, created_at, updated_at | [VERIFIED: app/models/project.py:22-30] |
| `Task` | `tasks` | id, title, description, status, priority, project_id, assignee_id, due_date, created_at, updated_at | [VERIFIED: app/models/task.py:30-41] |

[NOT_FOUND: searched "audit", "log", "notification" in app/models/ — the only `__tablename__` declarations are users, projects, and tasks]

Relationships are declared directly on the models — for example on `User`:

[VERIFIED: app/models/user.py:21-23]
```python
    # Relationships
    projects = relationship("Project", back_populates="owner")
    assigned_tasks = relationship("Task", back_populates="assignee")
```

`Project.tasks` cascades deletes to its tasks [VERIFIED: app/models/project.py:34], and `Task` links back to both `Project` and `User` [VERIFIED: app/models/task.py:44-45].

### What Does Not Exist

[NOT_FOUND: searched "auth", "login", "jwt", "token" in app/ and main.py — no authentication layer; every endpoint is open]

[NOT_FOUND: searched "smtp", "sendgrid", "send_email", "mailer" in app/ — no email delivery; the only mail-adjacent hits are the `User.email` column and the `get_by_email` lookup]

[NOT_FOUND: searched "redis", "cache" in app/ and main.py — no caching layer]

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|--------------|------|-----------------------------|----------|
| `/users` routes | HTTP API | users router → `UserRepository` | [VERIFIED: main.py:19, app/api/users.py:15-63] |
| `/projects` routes | HTTP API | projects router → `ProjectRepository`, `UserRepository` | [VERIFIED: main.py:20, app/api/projects.py:16-107] |
| `/tasks` routes | HTTP API | tasks router → `TaskService`, `TaskRepository` | [VERIFIED: main.py:21, app/api/tasks.py:16-150] |
| `GET /health` | HTTP API | inline handler in `main.py` | [VERIFIED: main.py:24-27] |

[NOT_FOUND: searched for templates/, static/, "fetch(", "axios" under tasktracker/ — no frontend assets and no CLI entry points; HTTP is the only execution surface]

The app is presumably served with `uvicorn main:app` — uvicorn is pinned but no launch script or `__main__` block exists [INFERRED: uvicorn pinned at requirements.txt:2; main.py ends at the health handler with no launcher].

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input Type | Output Type | Participating Components |
|-------|------------|-------------|--------------------------|
| Request validation | HTTP JSON | Pydantic schema instance (`UserCreate`, `ProjectCreate`, `TaskCreate`, …) | routers + `app/schemas/` |
| Business rules | Schema instance | ORM entity + side effects | `TaskService` (project existence check, task limit) |
| Persistence | Schema instance / ORM entity | Committed rows | repositories + `SessionLocal` |
| Notification egress | Task event | Webhook JSON payload | `NotificationService` |
| Response serialization | ORM entity | Response schema JSON (`TaskResponse`, …) | routers + `app/schemas/` |

### 3.3 Pointers to Code Flow Documentation

Candidates for detailed flow tracing (see `02-code-flows.md`):

- **Task creation** — `POST /tasks/` → `TaskService.create_task` (limit check + notification)
- **Task completion notification** — `PUT /tasks/{task_id}` → `TaskService.update_task_status`
- **Overdue task listing** — `GET /tasks/overdue` → `TaskRepository.get_overdue`

Detailed execution paths deliberately belong in `02-code-flows.md`, not here.

### Section 3 Self-Check
- [x] No method bodies longer than 3 lines quoted in this section
- [x] No loops or conditionals described
- [x] Movements described as conceptual stages
- [x] Defers detailed tracing to `02-code-flows.md`

---

## 4. File/Folder Conventions

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| `app/api/*.py` | One router module per resource | [VERIFIED: app/api/users.py:2, app/api/projects.py:2, app/api/tasks.py:2] |
| `app/models/*.py` | One SQLAlchemy model module per entity | [VERIFIED: app/models/user.py:2, app/models/project.py:2, app/models/task.py:2] |
| `app/schemas/*.py` | Pydantic Create/Update/Response triad per entity | [VERIFIED: app/schemas/task.py:10, 20, 30] |
| `app/repositories/*_repository.py` | Data-access class per entity | [VERIFIED: app/repositories/task_repository.py:2, app/repositories/user_repository.py:2] |
| `app/services/*_service.py` | Business-logic classes | [VERIFIED: app/services/task_service.py:2, app/services/notification_service.py:2] |
| `app/core/` | Cross-cutting config and database setup | [VERIFIED: app/core/config.py:2, app/core/database.py:2] |

Database sessions are injected into every handler through FastAPI's `Depends(get_db)` [VERIFIED: app/api/users.py:16, app/api/tasks.py:20]:

[VERIFIED: app/core/database.py:21-30]
```python
def get_db():
    """
    Dependency that provides database session.
    Yields session and ensures cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 5. External Dependencies

| Dependency | Purpose | Evidence |
|------------|---------|----------|
| `fastapi==0.104.1` | Web framework | [VERIFIED: requirements.txt:1] |
| `uvicorn==0.24.0` | ASGI server (no launch script in repo) | [VERIFIED: requirements.txt:2] |
| `sqlalchemy==2.0.23` | ORM, synchronous engine | [VERIFIED: requirements.txt:3, app/core/database.py:11] |
| `pydantic==2.5.2` | Validation | [VERIFIED: requirements.txt:4] |
| `python-dotenv==1.0.0` | `.env` loading | [VERIFIED: requirements.txt:5, app/core/config.py:5] |
| `httpx` | Webhook HTTP client — imported but **not pinned** | [VERIFIED: app/services/notification_service.py:4] |

[NOT_FOUND: searched "httpx" in requirements.txt — the import in app/services/notification_service.py has no matching pinned dependency]

The only external service integration is an outbound notification webhook, configured entirely by environment variables:

[VERIFIED: app/core/config.py:16-18]
```python
    # Notification settings - external webhook
    NOTIFICATION_WEBHOOK_URL: str = os.getenv("NOTIFICATION_WEBHOOK_URL", "")
    NOTIFICATION_ENABLED: bool = os.getenv("NOTIFICATION_ENABLED", "false").lower() == "true"
```

Notifications fire on task creation [VERIFIED: app/services/task_service.py:47] and on completion [VERIFIED: app/services/task_service.py:62], and POST to the configured URL [VERIFIED: app/services/notification_service.py:54-58].

---

## 6. Known Issues & Risks

### 6.1 Magic number duplicated

The per-project task limit is defined in two places:

[VERIFIED: app/core/config.py:20-21]
```python
    # Wart: Magic number for task limit, duplicated in TaskService
    MAX_TASKS_PER_PROJECT: int = 100
```

[VERIFIED: app/services/task_service.py:17-18]
```python
    # Wart: Magic number duplicated from config.py
    MAX_TASKS_PER_PROJECT = 100
```

`TaskService` reads its own copy when enforcing the limit, so changing the config value alone has no effect [VERIFIED: app/services/task_service.py:38].

### 6.2 Synchronous HTTP call in the notification path

[VERIFIED: app/services/notification_service.py:52-59]
```python
        try:
            # Wart: Should use async httpx in production
            with httpx.Client(timeout=5.0) as client:
                response = client.post(
                    settings.NOTIFICATION_WEBHOOK_URL,
                    json=payload
                )
                response.raise_for_status()
```

The blocking `httpx.Client` call runs inside request handling; under an async server this can stall the event loop.

### 6.3 Notification failures are swallowed

[VERIFIED: app/services/notification_service.py:60-62]
```python
        except httpx.HTTPError as e:
            # Wart: Silently fails, no retry
            logger.error(f"Failed to send notification: {e}")
```

No retry and no dead-letter handling; the API response succeeds even when the webhook never arrives.

### 6.4 Unpaginated default task listing with dead code

[VERIFIED: app/api/tasks.py:33-37]
```python
        # Wart: No pagination on default list
        tasks = repo.get_by_project(1) if False else []
        # Actually get all - but this is expensive
        from app.models.task import Task
        tasks = db.query(Task).limit(100).all()
```

The unfiltered `GET /tasks/` branch contains dead code (`if False`) and an inline import, and caps results at a hardcoded 100 with no offset support.

### 6.5 Tables created at import time

[VERIFIED: main.py:8-10]
```python
# Create tables on startup - not recommended for production
# but fine for this example app
Base.metadata.create_all(bind=engine)
```

[NOT_FOUND: searched "alembic", "migration" in tasktracker/ — no migration tooling; schema changes require manual handling]

### 6.6 No connection pooling configured

[VERIFIED: app/core/database.py:10-14]
```python
# Wart: No connection pooling configured for SQLite
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite specific
)
```

### 6.7 Undeclared runtime dependency

`httpx` is imported [VERIFIED: app/services/notification_service.py:4] but absent from `requirements.txt` [NOT_FOUND: searched "httpx" in requirements.txt], so a fresh install from the pinned requirements fails at startup [INFERRED: main.py imports the api package, which transitively imports the notification service and its httpx import].

---

## 7. Entry Points Summary

All routers are mounted with URL prefixes in `main.py`:

[VERIFIED: main.py:19-21]
```python
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
```

| Route/Entry | Method | Handler | Middleware | Verified |
|-------------|--------|---------|------------|----------|
| `/users/` | GET | `list_users` | none | [VERIFIED: app/api/users.py:15-16] |
| `/users/{user_id}` | GET | `get_user` | none | [VERIFIED: app/api/users.py:22-23] |
| `/users/` | POST | `create_user` | none | [VERIFIED: app/api/users.py:32-33] |
| `/users/{user_id}` | PUT | `update_user` | none | [VERIFIED: app/api/users.py:45-46] |
| `/users/{user_id}` | DELETE | `delete_user` | none | [VERIFIED: app/api/users.py:55-56] |
| `/projects/` | GET | `list_projects` | none | [VERIFIED: app/api/projects.py:16-17] |
| `/projects/{project_id}` | GET | `get_project` | none | [VERIFIED: app/api/projects.py:37-38] |
| `/projects/` | POST | `create_project` | none | [VERIFIED: app/api/projects.py:56-57] |
| `/projects/{project_id}` | PUT | `update_project` | none | [VERIFIED: app/api/projects.py:79-80] |
| `/projects/{project_id}` | DELETE | `delete_project` | none | [VERIFIED: app/api/projects.py:99-100] |
| `/tasks/` | GET | `list_tasks` | none | [VERIFIED: app/api/tasks.py:16-17] |
| `/tasks/overdue` | GET | `list_overdue_tasks` | none | [VERIFIED: app/api/tasks.py:57-58] |
| `/tasks/{task_id}` | GET | `get_task` | none | [VERIFIED: app/api/tasks.py:80-81] |
| `/tasks/` | POST | `create_task` | none | [VERIFIED: app/api/tasks.py:102-103] |
| `/tasks/{task_id}` | PUT | `update_task` | none | [VERIFIED: app/api/tasks.py:122-123] |
| `/tasks/{task_id}` | DELETE | `delete_task` | none | [VERIFIED: app/api/tasks.py:142-143] |
| `/health` | GET | `health_check` | none | [VERIFIED: main.py:24-25] |

[NOT_FOUND: searched "middleware", "CORSMiddleware", "add_middleware" in app/ and main.py — no middleware is registered anywhere, hence "none" in every row]

---

## 8. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| Backend framework | FastAPI 0.104.1 | [VERIFIED: requirements.txt:1] |
| ASGI server | Uvicorn 0.24.0 | [VERIFIED: requirements.txt:2] |
| ORM | SQLAlchemy 2.0.23, synchronous `create_engine` + `sessionmaker` | [VERIFIED: requirements.txt:3, app/core/database.py:11-16] |
| Validation | Pydantic 2.5.2 | [VERIFIED: requirements.txt:4, app/schemas/task.py:4] |
| Primary database | SQLite (default `DATABASE_URL`) | [VERIFIED: app/core/config.py:14] |
| Outbound HTTP | httpx sync `Client` (unpinned) | [VERIFIED: app/services/notification_service.py:4, 54] |
| Frontend framework | None | [NOT_FOUND: no templates/, static/, or JS assets in tasktracker/] |
| External services | Single notification webhook | [VERIFIED: app/core/config.py:17] |

[NOT_FOUND: searched "asyncio", "AsyncSession", "create_async_engine", "async def" in app/ and main.py — the entire request path is synchronous]

---

## Why This Example is GOOD

1. **Every positive claim carries a `file:line` citation** that resolves against `examples/fastapi/tasktracker/` — run the verify command at the top of this document and every citation checks out.
2. **Quoted code is copy-pasted, not paraphrased** — each fenced block matches the cited slice exactly, so the verifier's phase-2 quote check passes.
3. **Absences are proven, not assumed** — every `[NOT_FOUND]` records the actual search terms and scope used (auth, email delivery, redis, audit_log, async DB, middleware, migrations), so a reader can re-run the same searches.
4. **No step-by-step execution traces** — Section 3 uses discovery tables and defers all tracing to `02-code-flows.md`, exactly as prompt 01 requires.
5. **Warts are documented with evidence** — the duplicated magic number, sync HTTP, swallowed failures, dead code, and the unpinned `httpx` import are all cited, not hand-waved.
6. **Counts are honest** — the Verification Summary numbers are transcribed from `verify.py`'s tag-count output for this document, not estimated.
