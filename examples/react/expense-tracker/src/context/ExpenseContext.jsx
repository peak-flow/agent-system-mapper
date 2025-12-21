import { createContext, useContext, useReducer, useEffect } from 'react'
import { expenseService } from '../services/expenseService'

const ExpenseContext = createContext()

// Action types
const ACTIONS = {
  SET_EXPENSES: 'SET_EXPENSES',
  ADD_EXPENSE: 'ADD_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
}

// Initial state
const initialState = {
  expenses: [],
  loading: false,
  error: null,
}

// Reducer - handles state updates
function expenseReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_EXPENSES:
      return { ...state, expenses: action.payload, loading: false }
    case ACTIONS.ADD_EXPENSE:
      return { ...state, expenses: [...state.expenses, action.payload] }
    case ACTIONS.DELETE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      }
    case ACTIONS.UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      }
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

// Provider component
export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState)

  // Load expenses on mount
  useEffect(() => {
    loadExpenses()
  }, [])

  async function loadExpenses() {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true })
    try {
      const expenses = await expenseService.getAll()
      dispatch({ type: ACTIONS.SET_EXPENSES, payload: expenses })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  async function addExpense(expense) {
    try {
      const newExpense = await expenseService.create(expense)
      dispatch({ type: ACTIONS.ADD_EXPENSE, payload: newExpense })
      return newExpense
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      throw error
    }
  }

  async function deleteExpense(id) {
    try {
      await expenseService.delete(id)
      dispatch({ type: ACTIONS.DELETE_EXPENSE, payload: id })
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message })
      throw error
    }
  }

  // Wart: No update function implemented yet
  // async function updateExpense(id, data) { ... }

  const value = {
    expenses: state.expenses,
    loading: state.loading,
    error: state.error,
    addExpense,
    deleteExpense,
    loadExpenses,
  }

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  )
}

// Custom hook for consuming context
export function useExpenses() {
  const context = useContext(ExpenseContext)
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider')
  }
  return context
}
