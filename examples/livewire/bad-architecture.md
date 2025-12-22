# ApprovalFlow Architecture Overview

## What This System Does

ApprovalFlow is a comprehensive multi-step approval workflow system built with Laravel Livewire. It handles expense requests, content moderation, and internal change requests with full role-based access control.

## Technology Stack

- Laravel 10 with Livewire 3
- Alpine.js for client-side interactions
- TailwindCSS for styling
- MySQL database
- Redis for caching and queue
- Pusher for real-time updates

## Components

### Livewire Components
- RequestList - Paginated list with filters and real-time updates
- RequestForm - Create/edit form with validation
- RequestDetail - Full request view with all related data
- ApprovalActions - Approve/reject buttons with confirmation
- CommentSection - Threaded comments with real-time updates
- NotificationBell - Real-time notification dropdown
- UserProfile - User settings and preferences

### Services
- ApprovalService - Orchestrates the approval workflow
- NotificationService - Sends emails, SMS, and push notifications
- AuditService - Tracks all system changes
- PDFService - Generates approval certificates

### Jobs
- SendApprovalNotification - Queued email sending
- GenerateReportJob - Weekly summary reports
- CleanupOldRequests - Archive old completed requests

## Data Flow

1. User creates request via Livewire form
2. Request saved to database with draft status
3. User submits for review
4. Reviewers notified via Pusher
5. Reviewer approves/rejects
6. Requester notified of outcome
7. PDF certificate generated if approved

## Authentication

Uses Laravel Sanctum with:
- Multi-factor authentication
- Session-based web auth
- API tokens for mobile app
- OAuth for SSO integration

## Real-time Features

- Live updates when request status changes
- Real-time comment notifications
- Presence indicators showing who's viewing
- Typing indicators in comments

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
