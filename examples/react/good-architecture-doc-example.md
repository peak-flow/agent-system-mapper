# ExpenseTracker Architecture Overview

## Metadata
| Field | Value |
|-------|-------|
| Repository | `agent-system-mapper` |
| Path | `examples/react/expense-tracker/` |
| Commit | `bfd3ee6` |
| Documented | `2025-12-21` |
| Verification Status | `Verified` |

## Verification Summary
- [VERIFIED]: 24 claims
- [INFERRED]: 2 claims
- [NOT_FOUND]: 6 items (Redux, auth, backend API, tests, TailwindCSS, sync)
- [ASSUMED]: 1 item (Vite conventions)

---

## System Classification
| Field | Value |
|-------|-------|
| Type | Frontend SPA |
| Evidence | `package.json` with `react`, `react-router-dom`, no server code |
| Confidence | `[VERIFIED]` |

---

## System Purpose

ExpenseTracker is a **client-side expense tracking single-page application** built with React.

[VERIFIED: `package.json:6-8`]
```json
"dependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0"
}
```

[NOT_FOUND: searched "axios", "fetch", "api" in src/services/]
**No backend API integration.** Data persisted to localStorage only.

[NOT_FOUND: searched "redux", "store", "slice" in src/]
**No Redux.** Uses React Context with useReducer for state.

---

## Component Map

| Component | Location | Responsibility | Verified |
|-----------|----------|----------------|----------|
| App | `src/App.jsx` | Route configuration, layout | [VERIFIED] |
| Header | `src/components/Header.jsx` | Navigation bar | [VERIFIED] |
| ExpenseList | `src/components/ExpenseList.jsx` | Render expense items | [VERIFIED] |
| ExpenseItem | `src/components/ExpenseItem.jsx` | Single expense row with delete | [VERIFIED] |
| ExpenseForm | `src/components/ExpenseForm.jsx` | Add expense form | [VERIFIED] |
| Dashboard | `src/pages/Dashboard.jsx` | Main view with summary | [VERIFIED] |
| AddExpense | `src/pages/AddExpense.jsx` | Add expense page | [VERIFIED] |
| ExpenseDetail | `src/pages/ExpenseDetail.jsx` | Single expense view | [VERIFIED] |
| ExpenseContext | `src/context/ExpenseContext.jsx` | Global state management | [VERIFIED] |
| expenseService | `src/services/expenseService.js` | localStorage CRUD | [VERIFIED] |

[NOT_FOUND: searched "auth", "login", "user" in src/]
No authentication layer.

[NOT_FOUND: searched "test", "spec", ".test." in examples/react/]
No test files.

---

## File Structure

```
expense-tracker/
├── index.html                 # HTML entry point [VERIFIED]
├── package.json               # Dependencies [VERIFIED]
├── vite.config.js             # Build config [VERIFIED]
└── src/
    ├── main.jsx              # React entry, providers [VERIFIED]
    ├── App.jsx               # Router setup [VERIFIED]
    ├── index.css             # Global styles [VERIFIED]
    ├── components/
    │   ├── Header.jsx        # Nav bar [VERIFIED]
    │   ├── ExpenseList.jsx   # List display [VERIFIED]
    │   ├── ExpenseItem.jsx   # Item row [VERIFIED]
    │   └── ExpenseForm.jsx   # Add form [VERIFIED]
    ├── pages/
    │   ├── Dashboard.jsx     # Main page [VERIFIED]
    │   ├── AddExpense.jsx    # Add page [VERIFIED]
    │   └── ExpenseDetail.jsx # Detail page [VERIFIED]
    ├── context/
    │   └── ExpenseContext.jsx # State management [VERIFIED]
    ├── hooks/
    │   └── useTotalExpenses.js # Computed values [VERIFIED]
    ├── services/
    │   └── expenseService.js  # Data access [VERIFIED]
    └── utils/
        ├── formatters.js      # Display formatting [VERIFIED]
        └── constants.js       # App constants [VERIFIED]
```

---

## State Management

Uses React Context with useReducer pattern.

[VERIFIED: `src/context/ExpenseContext.jsx:8-14`]
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

[VERIFIED: `src/context/ExpenseContext.jsx:46-51`]
```javascript
export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState)

  useEffect(() => {
    loadExpenses()
  }, [])
```

Provider wraps app:
[VERIFIED: `src/main.jsx:9-13`]
```javascript
<BrowserRouter>
  <ExpenseProvider>
    <App />
  </ExpenseProvider>
</BrowserRouter>
```

---

## Data Persistence

[VERIFIED: `src/services/expenseService.js:7-8`]
```javascript
const STORAGE_KEY = 'expense-tracker-data'
```

**No backend API.** All data stored in browser localStorage.

[VERIFIED: `src/services/expenseService.js:13-20`]
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

---

## Routing

[VERIFIED: `src/App.jsx:12-16`]
```javascript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/add" element={<AddExpense />} />
  <Route path="/expense/:id" element={<ExpenseDetail />} />
</Routes>
```

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | List expenses, show total |
| `/add` | AddExpense | Form to add expense |
| `/expense/:id` | ExpenseDetail | View single expense |

---

## Entry Points

### User Entry Points
| Entry | Component | Trigger |
|-------|-----------|---------|
| Add expense | Header | Click "+ Add Expense" link |
| Delete expense | ExpenseItem | Click "Delete" button |
| View detail | ExpenseItem | Click expense title |

### Application Entry
[VERIFIED: `src/main.jsx:8-14`]
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

---

## Custom Hooks

[VERIFIED: `src/hooks/useTotalExpenses.js:8-14`]
```javascript
export function useTotalExpenses() {
  const { expenses } = useExpenses()

  const total = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [expenses])

  return total
}
```

[VERIFIED: `src/hooks/useTotalExpenses.js:19-31`]
```javascript
export function useExpensesByCategory() {
  // Wart: Not used anywhere yet, but could be useful
```

---

## Known Issues / Warts

### 1. No Confirmation on Delete (ExpenseItem)

[VERIFIED: `src/components/ExpenseItem.jsx:14`]
```javascript
// Wart: No confirmation dialog before delete
```

Delete happens immediately without user confirmation.

### 2. Update Not Implemented

[VERIFIED: `src/context/ExpenseContext.jsx:78-79`]
```javascript
// Wart: No update function implemented yet
// async function updateExpense(id, data) { ... }
```

[VERIFIED: `src/services/expenseService.js:66-69`]
```javascript
async update(id, data) {
  throw new Error('Not implemented')
}
```

### 3. Hardcoded Currency

[VERIFIED: `src/utils/formatters.js:7-8`]
```javascript
// Wart: Hardcoded to USD, should be configurable
```

### 4. Duplicated Storage Key

[VERIFIED: `src/services/expenseService.js:7`]
```javascript
const STORAGE_KEY = 'expense-tracker-data'
```

[VERIFIED: `src/utils/constants.js:14`]
```javascript
// Storage key - Wart: also duplicated in expenseService.js
export const STORAGE_KEY = 'expense-tracker-data'
```

### 5. Detail Page Fetches Directly

[VERIFIED: `src/pages/ExpenseDetail.jsx:10`]
```javascript
// Wart: Fetches from service directly instead of using context
```

Should use context to avoid duplicate fetches.

### 6. Basic Form Validation

[VERIFIED: `src/components/ExpenseForm.jsx:27`]
```javascript
// Wart: Basic validation only, no error messages shown
```

---

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| UI Framework | React 18 [VERIFIED: package.json] |
| Routing | React Router 6 [VERIFIED: package.json] |
| State | Context + useReducer [VERIFIED: ExpenseContext.jsx] |
| Build Tool | Vite 5 [VERIFIED: package.json] |
| Styling | Plain CSS [VERIFIED: index.css, inline styles] |
| Data Storage | localStorage [VERIFIED: expenseService.js] |

[NOT_FOUND: searched "tailwind", "styled", "sass" in expense-tracker/]
No CSS framework - uses plain CSS and inline styles.

---

## What This System Does NOT Have

Based on searches finding no results:

1. **No Backend API** - localStorage only
2. **No Authentication** - No login/user system
3. **No Redux** - Uses Context API
4. **No Tests** - No test files found
5. **No CSS Framework** - Plain CSS only
6. **No Real-time Sync** - Local data only
7. **No Update Feature** - Only create and delete
