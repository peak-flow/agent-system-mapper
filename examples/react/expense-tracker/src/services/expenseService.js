/**
 * Expense Service - handles API calls
 * Wart: Currently uses localStorage, not a real API
 */

const STORAGE_KEY = 'expense-tracker-data'

// Simulate API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Get stored data or return empty array
function getStoredExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Save data to storage
function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
}

// Generate unique ID - Wart: should use UUID in production
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const expenseService = {
  /**
   * Get all expenses
   */
  async getAll() {
    await delay(100) // Simulate network delay
    return getStoredExpenses()
  },

  /**
   * Get single expense by ID
   */
  async getById(id) {
    await delay(50)
    const expenses = getStoredExpenses()
    const expense = expenses.find((e) => e.id === id)
    if (!expense) {
      throw new Error('Expense not found')
    }
    return expense
  },

  /**
   * Create new expense
   */
  async create(data) {
    await delay(100)
    const expenses = getStoredExpenses()
    const newExpense = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    }
    expenses.push(newExpense)
    saveExpenses(expenses)
    return newExpense
  },

  /**
   * Delete expense by ID
   */
  async delete(id) {
    await delay(100)
    const expenses = getStoredExpenses()
    const filtered = expenses.filter((e) => e.id !== id)
    if (filtered.length === expenses.length) {
      throw new Error('Expense not found')
    }
    saveExpenses(filtered)
    return { success: true }
  },

  /**
   * Update expense
   * Wart: Not implemented, matches missing updateExpense in context
   */
  async update(id, data) {
    throw new Error('Not implemented')
  },
}
