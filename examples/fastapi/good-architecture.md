# TaskTracker Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/fastapi/tasktracker/` |
| Commit | `ecd9f00` |
| Documented | `2025-12-21` |
| Verification Status | `Verified` |

## Verification Summary
- [VERIFIED]: 28 claims
- [INFERRED]: 2 claims
- [NOT_FOUND]: 5 items (auth, email, redis, audit_log, async db)
- [ASSUMED]: 1 item (standard FastAPI conventions)

---

## System Purpose

TaskTracker is a **task and project management REST API** built with FastAPI.

[VERIFIED: `main.py:10-14`]
```python
app = FastAPI(
    title="TaskTracker API",
    description="Simple task and project management API",
    version="1.0.0"
)
```

The API provides CRUD operations for:
- Users [VERIFIED: `app/api/users.py`]
- Projects [VERIFIED: `app/api/projects.py`]
- Tasks [VERIFIED: `app/api/tasks.py`]

---

## Component Map

| Component | Location | Responsibility | Verified |
|-----------|----------|----------------|----------|
| FastAPI App | `main.py` | Application entry, router mounting | [VERIFIED] |
| API Routers | `app/api/` | HTTP request handlers | [VERIFIED] |
| SQLAlchemy Models | `app/models/` | Database entities | [VERIFIED] |
| Pydantic Schemas | `app/schemas/` | Request/response validation | [VERIFIED] |
| Repositories | `app/repositories/` | Data access layer | [VERIFIED] |
| Services | `app/services/` | Business logic | [VERIFIED] |
| Config | `app/core/config.py` | Environment settings | [VERIFIED] |
| Database | `app/core/database.py` | DB session management | [VERIFIED] |

[NOT_FOUND: searched "auth", "login", "jwt", "token" in app/]
No authentication layer exists. API endpoints are open.

[NOT_FOUND: searched "email", "sendgrid", "smtp" in app/]
No email service. Only webhook notifications exist.

[NOT_FOUND: searched "redis", "cache" in app/]
No caching layer implemented.

---

## File Structure

```
tasktracker/
├── main.py                    # FastAPI app initialization [VERIFIED]
├── requirements.txt           # Dependencies [VERIFIED]
└── app/
    ├── api/                   # Route handlers
    │   ├── users.py          # User CRUD [VERIFIED]
    │   ├── projects.py       # Project CRUD [VERIFIED]
    │   └── tasks.py          # Task CRUD [VERIFIED]
    ├── core/
    │   ├── config.py         # Settings from env [VERIFIED]
    │   └── database.py       # SQLAlchemy setup [VERIFIED]
    ├── models/               # SQLAlchemy ORM models
    │   ├── user.py           # User entity [VERIFIED]
    │   ├── project.py        # Project entity [VERIFIED]
    │   └── task.py           # Task entity [VERIFIED]
    ├── schemas/              # Pydantic models
    │   ├── user.py           # User DTOs [VERIFIED]
    │   ├── project.py        # Project DTOs [VERIFIED]
    │   └── task.py           # Task DTOs [VERIFIED]
    ├── repositories/         # Data access
    │   ├── user_repository.py     [VERIFIED]
    │   ├── project_repository.py  [VERIFIED]
    │   └── task_repository.py     [VERIFIED]
    └── services/             # Business logic
        ├── task_service.py        [VERIFIED]
        └── notification_service.py [VERIFIED]
```

---

## Data Models

### Relationships

[VERIFIED: `app/models/user.py:17-19`]
```python
# User has many projects and assigned tasks
projects = relationship("Project", back_populates="owner")
assigned_tasks = relationship("Task", back_populates="assignee")
```

[VERIFIED: `app/models/project.py:29-30`]
```python
# Project belongs to owner, has many tasks
owner = relationship("User", back_populates="projects")
tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
```

[VERIFIED: `app/models/task.py:37-38`]
```python
# Task belongs to project and optionally to assignee
project = relationship("Project", back_populates="tasks")
assignee = relationship("User", back_populates="assigned_tasks")
```

### Database Tables

| Table | Columns | Source |
|-------|---------|--------|
| users | id, email, name, created_at | [VERIFIED: `app/models/user.py:13-16`] |
| projects | id, name, description, status, owner_id, created_at, updated_at | [VERIFIED: `app/models/project.py:21-27`] |
| tasks | id, title, description, status, priority, project_id, assignee_id, due_date, created_at, updated_at | [VERIFIED: `app/models/task.py:27-35`] |

[NOT_FOUND: searched "audit", "log" in app/models/]
No audit_log table exists.

---

## Entry Points

### HTTP Endpoints

[VERIFIED: `main.py:16-18`]
```python
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
```

| Prefix | Router | Operations |
|--------|--------|------------|
| `/users` | `app/api/users.py` | list, get, create, update, delete |
| `/projects` | `app/api/projects.py` | list, get, create, update, delete |
| `/tasks` | `app/api/tasks.py` | list, get, create, update, delete, overdue |
| `/health` | `main.py:21-24` | health check |

---

## Key Patterns

### Dependency Injection for Database

[VERIFIED: `app/core/database.py:19-27`]
```python
def get_db():
    """Dependency that provides database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Used in endpoints:
[VERIFIED: `app/api/users.py:18`]
```python
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
```

### Repository Pattern

Repositories encapsulate data access:
[VERIFIED: `app/repositories/task_repository.py:13-17`]
```python
class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, task_id: int) -> Optional[Task]:
```

### Service Layer

Business logic separated from routes:
[VERIFIED: `app/services/task_service.py:17-23`]
```python
class TaskService:
    def __init__(self, db: Session):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)
        self.notification_service = NotificationService()
```

---

## External Integrations

### Webhook Notifications

[VERIFIED: `app/services/notification_service.py:14-15`]
```python
class NotificationService:
    """Service for sending notifications via webhook."""
```

Configuration:
[VERIFIED: `app/core/config.py:13-14`]
```python
NOTIFICATION_WEBHOOK_URL: str = os.getenv("NOTIFICATION_WEBHOOK_URL", "")
NOTIFICATION_ENABLED: bool = os.getenv("NOTIFICATION_ENABLED", "false").lower() == "true"
```

Events that trigger notifications:
- Task created [VERIFIED: `app/services/task_service.py:40`]
- Task completed [VERIFIED: `app/services/task_service.py:51`]

---

## Known Issues / Warts

### 1. Magic Number Duplication

[VERIFIED: `app/core/config.py:17`]
```python
MAX_TASKS_PER_PROJECT: int = 100
```

[VERIFIED: `app/services/task_service.py:19`]
```python
MAX_TASKS_PER_PROJECT = 100  # Wart: Magic number duplicated from config.py
```

Same value defined in two places - should use config.

### 2. Synchronous HTTP in Notification Service

[VERIFIED: `app/services/notification_service.py:45-49`]
```python
# Wart: Synchronous HTTP call in async context.
with httpx.Client(timeout=5.0) as client:
    response = client.post(...)
```

Uses sync HTTP client instead of async - can block event loop.

### 3. No Retry Logic for Notifications

[VERIFIED: `app/services/notification_service.py:52-53`]
```python
except httpx.HTTPError as e:
    # Wart: Silently fails, no retry
    logger.error(f"Failed to send notification: {e}")
```

Notification failures are logged but not retried.

### 4. No Pagination on Default Task List

[VERIFIED: `app/api/tasks.py:28-31`]
```python
# Wart: No pagination on default list
tasks = repo.get_by_project(1) if False else []
# Actually get all - but this is expensive
```

Default task list has no proper pagination when no filters applied.

### 5. Tables Created on Startup

[VERIFIED: `main.py:8-9`]
```python
# Create tables on startup - not recommended for production
Base.metadata.create_all(bind=engine)
```

Should use migrations (Alembic) instead.

---

## Configuration

[VERIFIED: `app/core/config.py:8-17`]

| Setting | Source | Default |
|---------|--------|---------|
| DATABASE_URL | env | `sqlite:///./tasktracker.db` |
| NOTIFICATION_WEBHOOK_URL | env | empty string |
| NOTIFICATION_ENABLED | env | `false` |
| MAX_TASKS_PER_PROJECT | hardcoded | `100` |

[NOT_FOUND: searched "async" in database.py]
Database is synchronous SQLite, not async.

---

## What This System Does NOT Have

Based on searches finding no results:

1. **No Authentication** - All endpoints are open
2. **No Email Service** - Only webhook notifications
3. **No Caching** - No Redis or in-memory cache
4. **No Audit Logging** - No change tracking
5. **No Async Database** - Uses sync SQLAlchemy
6. **No Migrations** - Tables created on startup
