# ExpenseTracker Architecture Overview

> ⚠️ **BAD EXAMPLE — DO NOT IMITATE.** This document demonstrates hallucination patterns. Each ❌ callout explains a failure. See good-architecture-doc-example.md for the correct approach.

## What This App Does

ExpenseTracker is a comprehensive expense tracking application built with React. It allows users to track their daily expenses, categorize spending, view reports, and sync data across devices.

> **❌ PROBLEMS:** No citations, and two of the four capabilities are invented. "Sync data across devices" is impossible — all persistence is browser localStorage (`src/services/expenseService.js:6`, and the file's own comment "Currently uses localStorage, not a real API" at `src/services/expenseService.js:3`). "View reports" doesn't exist either — the only routes are `/`, `/add`, and `/expense/:id` (`src/App.jsx:15-19`); there is no reports page.

## Technology Stack

- React 18 with hooks
- React Router for navigation
- Redux for state management
- Axios for API calls
- TailwindCSS for styling
- Jest and React Testing Library for tests

> **❌ PROBLEMS:** Half the stack is hallucinated. `package.json:5-13` lists exactly three dependencies (`react`, `react-dom`, `react-router-dom`) plus two dev dependencies (`vite`, `@vitejs/plugin-react`). There is no Redux, no Axios, no TailwindCSS, no Jest/RTL — and no `test` script (`package.json:14-18`). Styling is plain CSS (`src/index.css:1-17`) plus inline style objects (`src/components/Header.jsx:19-43`). A good doc would record each as `[NOT_FOUND: searched ...]`.

## Components

The app uses a component-based architecture:

### UI Components
- Header - Navigation and branding
- ExpenseList - Displays list of expenses
- ExpenseItem - Individual expense row
- ExpenseForm - Form for adding/editing expenses
- Dashboard - Main overview page

> **❌ PROBLEMS:** The named components do exist, but with zero `file:line` citations the reader cannot tell verified claims from guesses — and one detail is wrong: ExpenseForm only *adds* expenses; editing is unimplemented (`src/services/expenseService.js:87-89` throws `'Not implemented'`, and the context has no update function, `src/context/ExpenseContext.jsx:91-92`). The list also silently omits real modules: `src/pages/AddExpense.jsx`, `src/pages/ExpenseDetail.jsx`, `src/context/ExpenseContext.jsx`, `src/hooks/useTotalExpenses.js`, `src/utils/formatters.js`, `src/utils/constants.js`.

### State Management
Uses Redux with the following slices:
- expenseSlice - Manages expense CRUD operations
- userSlice - Handles authentication state
- settingsSlice - User preferences and config

> **❌ PROBLEMS:** Entirely false. State is React Context with `useReducer` (`src/context/ExpenseContext.jsx:52-53`) driving a plain reducer function (`src/context/ExpenseContext.jsx:24-49`). There are no slices, no store, no user state, no settings state — the initial state is just `expenses`, `loading`, `error` (`src/context/ExpenseContext.jsx:17-21`). Asserting Redux because most React apps use it is hallucination-by-convention.

### Services
- expenseService - API calls for expenses
- authService - Authentication with JWT
- syncService - Real-time sync with backend

> **❌ PROBLEMS:** `src/services/` contains exactly one file, `expenseService.js` — `authService` and `syncService` are invented. And `expenseService` makes no API calls: it reads and writes localStorage behind a simulated delay (`src/services/expenseService.js:9`, `src/services/expenseService.js:12-24`).

## Data Flow

1. User interacts with component
2. Component dispatches Redux action
3. Action calls API via service
4. Service returns data
5. Reducer updates store
6. Component re-renders with new data

> **❌ PROBLEMS:** Two failures at once. First, a numbered step-by-step trace belongs in code-flow documentation, not an architecture overview — the methodology requires tables describing what moves, not execution steps. Second, the steps are wrong: there are no Redux actions and no API. Components call context functions like `addExpense`, which await the localStorage-backed service and then dispatch to a `useReducer` reducer (`src/context/ExpenseContext.jsx:70-79`).

## API Integration

The app connects to a REST API:
- GET /api/expenses - List all expenses
- POST /api/expenses - Create expense
- PUT /api/expenses/:id - Update expense
- DELETE /api/expenses/:id - Delete expense

> **❌ PROBLEMS:** All four endpoints are fabricated. There is no `fetch`, `axios`, or `XMLHttpRequest` anywhere in `src/`. The closest reality is the async facade over localStorage: `getAll` (`src/services/expenseService.js:35-38`), `getById` (`:43-51`), `create` (`:56-67`), `delete` (`:72-81`) — and `update` just throws (`src/services/expenseService.js:87-89`), so even the *shape* of the invented API (a working PUT) contradicts the code.

## Authentication

Uses JWT-based authentication:
- Login creates access and refresh tokens
- Tokens stored in secure cookies
- Auto-refresh on expiration
- Protected routes require valid token

> **❌ PROBLEMS:** There is no authentication of any kind. No login UI, no token handling, no cookies, no route guards — the three routes render unconditionally (`src/App.jsx:15-19`). Searching `src/` for "auth", "login", "jwt", "token" finds nothing. Every line of this section is invented.

## Database Schema

| Table | Columns |
|-------|---------|
| users | id, email, password_hash, created_at |
| expenses | id, user_id, amount, category, description, date |
| categories | id, name, icon, color |

> **❌ PROBLEMS:** A client-only SPA has no database. The real data model is an array of expense objects in localStorage with `id`, `...data` (description, amount, category), and `createdAt`, built in `create()` (`src/services/expenseService.js:59-63`). There is no `users` table (no users at all), and categories are a hardcoded string array, not a table (`src/utils/constants.js:6-15`) — no icons, no colors.

## Why This Example is BAD

1. **No metadata, no commit hash, no verification tags anywhere** — not a single claim carries `[VERIFIED: path:line]`, so nothing can be checked and `verify.py` has nothing to verify. → The good example resolves 90/90 citations.
2. **Invented state management**: Redux with expenseSlice/userSlice/settingsSlice → reality: Context + `useReducer` (`src/context/ExpenseContext.jsx:52-53`) with only expenses/loading/error state (`src/context/ExpenseContext.jsx:17-21`).
3. **Invented network layer**: Axios + four REST endpoints → reality: zero network calls; localStorage behind a fake delay (`src/services/expenseService.js:9`, `src/services/expenseService.js:12-24`).
4. **Invented services**: authService, syncService → reality: `src/services/` holds only `expenseService.js`.
5. **Invented authentication**: JWT, refresh tokens, protected routes → reality: unguarded routes (`src/App.jsx:15-19`) and no auth code anywhere in `src/`.
6. **Invented testing stack**: Jest and React Testing Library → reality: no test files and no test dependencies or script (`package.json:10-18`).
7. **Invented styling stack**: TailwindCSS → reality: plain CSS (`src/index.css:1-17`) and inline style objects (`src/components/Header.jsx:19-43`).
8. **False capability claims**: cross-device sync and reports → reality: localStorage-only persistence (`src/services/expenseService.js:3-6`) and three routes with no reports page (`src/App.jsx:15-19`).
9. **False editing claim**: "adding/editing expenses" → reality: update is unimplemented and throws (`src/services/expenseService.js:87-89`; `src/context/ExpenseContext.jsx:91-92`).
10. **Invented database schema**: users/expenses/categories tables → reality: no database; expense objects assembled in `create()` (`src/services/expenseService.js:59-63`) and a hardcoded category array (`src/utils/constants.js:6-15`).
11. **Step-by-step "Data Flow" trace in an architecture doc** — execution tracing belongs in code-flow documentation; the overview must stay at discovery level (tables, not numbered steps).
12. **No `[NOT_FOUND]` admissions** — a trustworthy doc records what it searched for and failed to find; this one asserts instead of admitting.
