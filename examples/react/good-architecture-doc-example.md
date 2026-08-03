# ExpenseTracker Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/react/expense-tracker/` |
| Commit | `9a69c14` |
| Documented | `2026-08-03` |
| Verification Status | `Verified` |

**Verify with:**
```bash
python3 verify.py examples/react/good-architecture-doc-example.md --repo-root examples/react/expense-tracker
```

## Verification Summary
- `[VERIFIED]`: 74 tags (90 `file:line` citations, all resolving; 15 quoted blocks, all matching)
- `[INFERRED]`: 1 claim (Vite serving conventions)
- `[NOT_FOUND]`: 11 items (server code, backend API, Redux, auth, tests, network calls, env config, sync, CSS framework, edit UI, external services)
- `[ASSUMED]`: 0 items

---

## 0. System Classification

| Field | Value |
|-------|-------|
| Category | Traditional Code |
| Type | Frontend SPA |
| Evidence | `package.json` depends on `react` and `react-router-dom` [VERIFIED: package.json:5-9]; client entry mounts into `#root` [VERIFIED: src/main.jsx:8, index.html:9] |
| Overlay Loaded | No |
| Confidence | `[VERIFIED]` |

[NOT_FOUND: searched "express", "server", "listen(" in expense-tracker/ — no server-side code of any kind]

---

## 1. System Purpose

ExpenseTracker is a **client-side expense tracking single-page application**: users add expenses (description, amount, category), see a running total on a dashboard, and view or delete individual expenses. All data lives in the browser's localStorage — there is no backend.

[VERIFIED: package.json:5-9]
```json
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
```

[NOT_FOUND: searched "axios", "fetch(", "XMLHttpRequest" in src/ — no backend API integration; data is persisted to localStorage only]

[NOT_FOUND: searched "redux", "slice", "configureStore" in src/ — no Redux; state management uses React Context with useReducer]

---

## 2. Component Map

| Component | Location | Responsibility | Evidence |
|-----------|----------|----------------|----------|
| App | `src/App.jsx` | Route configuration, layout shell | [VERIFIED: src/App.jsx:11-21] |
| Header | `src/components/Header.jsx` | Navigation bar with Add link | [VERIFIED: src/components/Header.jsx:6-17] |
| ExpenseList | `src/components/ExpenseList.jsx` | Loading/error/empty/list rendering | [VERIFIED: src/components/ExpenseList.jsx:7-29] |
| ExpenseItem | `src/components/ExpenseItem.jsx` | Single expense row with delete button | [VERIFIED: src/components/ExpenseItem.jsx:8-18] |
| ExpenseForm | `src/components/ExpenseForm.jsx` | Controlled add-expense form | [VERIFIED: src/components/ExpenseForm.jsx:9-17] |
| Dashboard | `src/pages/Dashboard.jsx` | Total summary + recent expenses | [VERIFIED: src/pages/Dashboard.jsx:9-25] |
| AddExpense | `src/pages/AddExpense.jsx` | Page wrapper around ExpenseForm | [VERIFIED: src/pages/AddExpense.jsx:6-13] |
| ExpenseDetail | `src/pages/ExpenseDetail.jsx` | Single expense view with delete | [VERIFIED: src/pages/ExpenseDetail.jsx:11-17] |
| ExpenseContext | `src/context/ExpenseContext.jsx` | Global state (reducer + provider + hook) | [VERIFIED: src/context/ExpenseContext.jsx:24, 52, 109] |
| expenseService | `src/services/expenseService.js` | localStorage CRUD with simulated delay | [VERIFIED: src/services/expenseService.js:31-38] |
| useTotalExpenses | `src/hooks/useTotalExpenses.js` | Memoized total across expenses | [VERIFIED: src/hooks/useTotalExpenses.js:8-16] |
| formatters | `src/utils/formatters.js` | Currency/date formatting | [VERIFIED: src/utils/formatters.js:9-14] |
| constants | `src/utils/constants.js` | Category list, currency, storage key | [VERIFIED: src/utils/constants.js:6-21] |

[NOT_FOUND: searched "auth", "login", "jwt", "token" in src/ — no authentication layer]

[NOT_FOUND: searched "*.test.*", "*.spec.*", "__tests__" in expense-tracker/ — no test files, and package.json declares no test dependencies or test script]

### State Management

React Context with a useReducer store; six action types:

[VERIFIED: src/context/ExpenseContext.jsx:7-14]
```javascript
const ACTIONS = {
  SET_EXPENSES: 'SET_EXPENSES',
  ADD_EXPENSE: 'ADD_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
}
```

[VERIFIED: src/context/ExpenseContext.jsx:52-58]
```javascript
export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState)

  // Load expenses on mount
  useEffect(() => {
    loadExpenses()
  }, [])
```

The provider wraps the whole app:

[VERIFIED: src/main.jsx:10-14]
```javascript
    <BrowserRouter>
      <ExpenseProvider>
        <App />
      </ExpenseProvider>
    </BrowserRouter>
```

Consumers use the `useExpenses()` hook, which throws outside the provider [VERIFIED: src/context/ExpenseContext.jsx:109-115].

### Data Persistence

[VERIFIED: src/services/expenseService.js:6]
```javascript
const STORAGE_KEY = 'expense-tracker-data'
```

All reads parse that key from localStorage:

[VERIFIED: src/services/expenseService.js:12-19]
```javascript
function getStoredExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}
```

The service comment itself admits the design: "Currently uses localStorage, not a real API" [VERIFIED: src/services/expenseService.js:3].

---

## 3. Execution Surfaces & High-Level Data Movement (Discovery Only)

### 3.1 Primary Execution Surfaces

| Entry Surface | Type | Primary Components Involved | Evidence |
|---------------|------|-----------------------------|----------|
| Browser loads `index.html` | Web (SPA bootstrap) | main.jsx, ExpenseProvider, App | [VERIFIED: index.html:10, src/main.jsx:8-16] |
| Route `/` | Client-side route | Dashboard, ExpenseList, useTotalExpenses | [VERIFIED: src/App.jsx:16] |
| Route `/add` | Client-side route | AddExpense, ExpenseForm | [VERIFIED: src/App.jsx:17] |
| Route `/expense/:id` | Client-side route | ExpenseDetail, expenseService | [VERIFIED: src/App.jsx:18] |
| `npm run dev` / `build` / `preview` | CLI (Vite) | vite.config.js | [VERIFIED: package.json:15-17, vite.config.js:4-6] |

### 3.2 High-Level Data Movement (Non-Procedural)

| Stage | Input Type | Output Type | Participating Components |
|-------|------------|-------------|--------------------------|
| App bootstrap | localStorage JSON | `expenses` array in context state | ExpenseProvider, expenseService |
| Add expense | Form field values | New expense record + state update | ExpenseForm, ExpenseContext, expenseService |
| Delete expense | Expense id | Filtered expense array | ExpenseItem / ExpenseDetail, ExpenseContext, expenseService |
| Detail lookup | Route param `id` | Single expense object (local page state) | ExpenseDetail, expenseService |
| Total computation | `expenses` array | Memoized number | useTotalExpenses, Dashboard |

### 3.3 Pointers to Code Flow Documentation

Detailed execution paths are deliberately **not** traced here — see `02-code-flows.md` for:

- **Add Expense flow** — entry `ExpenseForm.handleSubmit` [VERIFIED: src/components/ExpenseForm.jsx:24-45]
- **Delete Expense flow** — entries `ExpenseItem.handleDelete` and `ExpenseDetail.handleDelete` [VERIFIED: src/components/ExpenseItem.jsx:11-18, src/pages/ExpenseDetail.jsx:34-44]
- **Load-on-mount flow** — entry `ExpenseProvider`'s `useEffect` → `loadExpenses` [VERIFIED: src/context/ExpenseContext.jsx:56-68]

---

## 3b. Frontend → Backend Interaction Map

Not applicable — this system has no backend. Every user interaction is handled entirely in the browser: context functions call `expenseService`, which reads and writes localStorage.

[NOT_FOUND: searched "fetch(", "axios", "XMLHttpRequest", "WebSocket" in src/ — no network calls of any kind]

---

## 4. File/Folder Conventions

Directory layout (all files below were read during documentation):

```
expense-tracker/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/     Header, ExpenseList, ExpenseItem, ExpenseForm
    ├── pages/          Dashboard, AddExpense, ExpenseDetail
    ├── context/        ExpenseContext
    ├── hooks/          useTotalExpenses
    ├── services/       expenseService
    └── utils/          formatters, constants
```

| Pattern | Meaning | Evidence |
|---------|---------|----------|
| `src/components/` | Reusable presentational components | [VERIFIED: src/components/Header.jsx:6, src/components/ExpenseList.jsx:7] |
| `src/pages/` | One component per route | [VERIFIED: src/App.jsx:16-18, src/pages/Dashboard.jsx:9] |
| `src/context/` | Context provider + reducer + consumer hook in one file | [VERIFIED: src/context/ExpenseContext.jsx:24, 52, 109] |
| `src/hooks/` | Custom hooks for derived state | [VERIFIED: src/hooks/useTotalExpenses.js:8, 22] |
| `src/services/` | Data-access layer (localStorage behind async API) | [VERIFIED: src/services/expenseService.js:31] |
| `src/utils/` | Pure helpers and constants | [VERIFIED: src/utils/formatters.js:9, src/utils/constants.js:6] |
| Inline `styles` objects per component | Styling co-located with components, plus one global stylesheet | [VERIFIED: src/components/Header.jsx:19-27, src/index.css:1-5] |

[INFERRED: `index.html` at the project root with `/src/main.jsx` as module entry follows the standard Vite serving convention — vite.config.js adds only the React plugin]

---

## 5. External Dependencies

| Dependency | Purpose | Evidence |
|------------|---------|----------|
| `react` ^18.2.0 | UI framework | [VERIFIED: package.json:6] |
| `react-dom` ^18.2.0 | DOM renderer | [VERIFIED: package.json:7] |
| `react-router-dom` ^6.20.0 | Client-side routing | [VERIFIED: package.json:8] |
| `vite` ^5.0.0 (dev) | Build tool / dev server | [VERIFIED: package.json:11] |
| `@vitejs/plugin-react` ^4.2.0 (dev) | React fast-refresh plugin | [VERIFIED: package.json:12, vite.config.js:2] |

[NOT_FOUND: searched "import.meta.env", "process.env" in src/ — no environment-driven configuration; there are no API base URLs or keys to configure]

---

## 6. Known Issues & Risks

### 6.1 No Confirmation on Delete in ExpenseItem

[VERIFIED: src/components/ExpenseItem.jsx:12]
```javascript
    // Wart: No confirmation dialog before delete
```

Inconsistent UX: ExpenseDetail's delete DOES ask for confirmation [VERIFIED: src/pages/ExpenseDetail.jsx:35], the list row's delete does not.

### 6.2 Update Not Implemented

[VERIFIED: src/context/ExpenseContext.jsx:91-92]
```javascript
  // Wart: No update function implemented yet
  // async function updateExpense(id, data) { ... }
```

[VERIFIED: src/services/expenseService.js:87-89]
```javascript
  async update(id, data) {
    throw new Error('Not implemented')
  },
```

The reducer even defines an `UPDATE_EXPENSE` action that nothing dispatches [VERIFIED: src/context/ExpenseContext.jsx:35-41].

### 6.3 Hardcoded Currency

[VERIFIED: src/utils/formatters.js:9-14]
```javascript
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
```

The wart is acknowledged in the file itself [VERIFIED: src/utils/formatters.js:7] and duplicated as a constant [VERIFIED: src/utils/constants.js:17-18].

### 6.4 Duplicated Storage Key

[VERIFIED: src/utils/constants.js:20-21]
```javascript
// Storage key - Wart: also duplicated in expenseService.js
export const STORAGE_KEY = 'expense-tracker-data'
```

The service defines its own copy of the same literal [VERIFIED: src/services/expenseService.js:6].

### 6.5 Detail Page Fetches Directly

[VERIFIED: src/pages/ExpenseDetail.jsx:9]
```javascript
 * Wart: Fetches from service directly instead of using context
```

`loadExpense` calls `expenseService.getById` instead of reading context state [VERIFIED: src/pages/ExpenseDetail.jsx:23-32].

### 6.6 Basic Form Validation

[VERIFIED: src/components/ExpenseForm.jsx:27-30]
```javascript
    // Wart: Basic validation only, no error messages shown
    if (!formData.description || !formData.amount) {
      return
    }
```

### 6.7 Dead Code

`useExpensesByCategory` is exported but never imported anywhere [VERIFIED: src/hooks/useTotalExpenses.js:20-22]; `formatRelativeTime` is a stub that just returns the plain date [VERIFIED: src/utils/formatters.js:32-35].

### 6.8 Features Confirmed Absent

- [NOT_FOUND: searched "websocket", "socket", "sync" in src/ — no cross-device sync; the only "sync" matches are local `async function` definitions]
- [NOT_FOUND: searched "tailwind", "styled", "sass" in expense-tracker/ — no CSS framework; plain CSS and inline style objects only]
- [NOT_FOUND: searched for an edit/update UI in src/pages/ and src/components/ — no edit form exists; expenses can only be created and deleted]

---

## 7. Entry Points Summary

### Application Bootstrap

[VERIFIED: src/main.jsx:8-16]
```javascript
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ExpenseProvider>
        <App />
      </ExpenseProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

### Routes

[VERIFIED: src/App.jsx:15-19]
```javascript
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/expense/:id" element={<ExpenseDetail />} />
      </Routes>
```

| Route/Entry | Method | Handler | Middleware | Verified |
|-------------|--------|---------|------------|----------|
| `/` | client-side GET | `Dashboard` | none (no router guards) | [VERIFIED: src/App.jsx:16] |
| `/add` | client-side GET | `AddExpense` | none | [VERIFIED: src/App.jsx:17] |
| `/expense/:id` | client-side GET | `ExpenseDetail` | none | [VERIFIED: src/App.jsx:18] |

### User-Initiated Triggers

| Trigger | Component | Evidence |
|---------|-----------|----------|
| "+ Add Expense" link | Header | [VERIFIED: src/components/Header.jsx:13] |
| Submit add-expense form | ExpenseForm | [VERIFIED: src/components/ExpenseForm.jsx:48] |
| Delete button (list row) | ExpenseItem | [VERIFIED: src/components/ExpenseItem.jsx:31-33] |
| Expense title link to detail | ExpenseItem | [VERIFIED: src/components/ExpenseItem.jsx:23-25] |
| Delete button (detail page) | ExpenseDetail | [VERIFIED: src/pages/ExpenseDetail.jsx:63-65] |

---

## 8. Technology Stack Summary

| Layer | Technology | Evidence |
|-------|------------|----------|
| UI Framework | React 18 | [VERIFIED: package.json:6] |
| Routing | React Router 6 | [VERIFIED: package.json:8] |
| State | Context + useReducer | [VERIFIED: src/context/ExpenseContext.jsx:53] |
| Build Tool | Vite 5 | [VERIFIED: package.json:11] |
| Styling | Plain CSS + inline style objects | [VERIFIED: src/index.css:7-11, src/components/Header.jsx:19] |
| Data Storage | Browser localStorage | [VERIFIED: src/services/expenseService.js:14, 23] |
| External Services | None | [NOT_FOUND: searched "http", "api", "key" in src/ — no external service integration] |

---

## Why This Example is GOOD

1. **Every claim is cited or admitted.** Each factual statement carries a `[VERIFIED: path:line]` tag that resolves against `examples/react/expense-tracker/`, or an explicit `[NOT_FOUND]` / `[INFERRED]` admission.
2. **Quotes are exact copy-paste.** Every fenced block matches the cited line range character-for-character, so `verify.py` phase 2 passes.
3. **Absence is documented with real searches.** `[NOT_FOUND]` items name the patterns searched (axios, redux, auth, tests...), including the honest note that "sync" only matches `async` keywords.
4. **Section 3 stays at discovery level.** Tables describe entry surfaces and what moves — no step-by-step traces, no arrow diagrams; detailed tracing is deferred to `02-code-flows.md`.
5. **The 3b section is answered, not skipped.** A frontend-only system states explicitly that no frontend-to-backend interactions exist, backed by a search.
6. **Warts are surfaced, not hidden.** The unimplemented update path, duplicated storage key, dead hooks, and inconsistent delete confirmation are documented with exact lines.
7. **It is machine-checkable.** Running the command in the metadata block exits 0.
