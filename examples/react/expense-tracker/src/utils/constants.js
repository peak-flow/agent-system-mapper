/**
 * Application constants
 */

// Expense categories
export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Travel',
  'Other',
]

// Wart: Should be in config, duplicated with hardcoded USD in formatters.js
export const DEFAULT_CURRENCY = 'USD'

// Storage key - Wart: also duplicated in expenseService.js
export const STORAGE_KEY = 'expense-tracker-data'
