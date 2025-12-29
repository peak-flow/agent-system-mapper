# ExpenseTracker Architecture Overview

## What This App Does

ExpenseTracker is a comprehensive expense tracking application built with React. It allows users to track their daily expenses, categorize spending, view reports, and sync data across devices.

## Technology Stack

- React 18 with hooks
- React Router for navigation
- Redux for state management
- Axios for API calls
- TailwindCSS for styling
- Jest and React Testing Library for tests

## Components

The app uses a component-based architecture:

### UI Components
- Header - Navigation and branding
- ExpenseList - Displays list of expenses
- ExpenseItem - Individual expense row
- ExpenseForm - Form for adding/editing expenses
- Dashboard - Main overview page

### State Management
Uses Redux with the following slices:
- expenseSlice - Manages expense CRUD operations
- userSlice - Handles authentication state
- settingsSlice - User preferences and config

### Services
- expenseService - API calls for expenses
- authService - Authentication with JWT
- syncService - Real-time sync with backend

## Data Flow

1. User interacts with component
2. Component dispatches Redux action
3. Action calls API via service
4. Service returns data
5. Reducer updates store
6. Component re-renders with new data

## API Integration

The app connects to a REST API:
- GET /api/expenses - List all expenses
- POST /api/expenses - Create expense
- PUT /api/expenses/:id - Update expense
- DELETE /api/expenses/:id - Delete expense

## Authentication

Uses JWT-based authentication:
- Login creates access and refresh tokens
- Tokens stored in secure cookies
- Auto-refresh on expiration
- Protected routes require valid token

## Database Schema

| Table | Columns |
|-------|---------|
| users | id, email, password_hash, created_at |
| expenses | id, user_id, amount, category, description, date |
| categories | id, name, icon, color |
