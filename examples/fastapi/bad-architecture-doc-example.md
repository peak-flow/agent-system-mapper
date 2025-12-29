# TaskTracker Architecture Overview

## What This System Does

TaskTracker is a comprehensive project management API built with FastAPI. It allows users to create projects, manage tasks, assign work to team members, and track progress with notifications.

## Components

### API Layer
The system uses FastAPI routers to handle HTTP requests. Each resource has its own router:
- Users router handles user CRUD operations
- Projects router manages project lifecycle
- Tasks router handles task management with status updates

### Database Layer
Uses SQLAlchemy ORM with async support for high-performance database operations. The models are well-structured with proper relationships:
- User has many Projects and Tasks
- Project has many Tasks
- Task belongs to Project and User

### Service Layer
Business logic is handled by services:
- TaskService handles task creation with notifications
- ProjectService handles project operations
- UserService manages user authentication
- NotificationService sends emails and push notifications

### Authentication
The API uses JWT authentication with refresh tokens. Users authenticate via the /auth/login endpoint and receive access tokens.

## Data Flow

1. Request comes in through FastAPI router
2. Pydantic validates the request body
3. Dependency injection provides database session
4. Service layer processes business logic
5. Repository layer handles database operations
6. Response is serialized via Pydantic models

## External Integrations

- **Email Service**: Sends transactional emails via SendGrid
- **Push Notifications**: Uses Firebase Cloud Messaging
- **Webhook System**: Notifies external services of task events
- **Redis Cache**: Caches frequently accessed data

## Key Patterns

- Repository pattern for data access
- Dependency injection via FastAPI's Depends
- Async/await for non-blocking operations
- Pydantic models for validation

## Database Schema

| Table | Description |
|-------|-------------|
| users | User accounts with email and password |
| projects | Projects owned by users |
| tasks | Tasks within projects |
| notifications | Notification queue |
| audit_log | Tracks all changes |
