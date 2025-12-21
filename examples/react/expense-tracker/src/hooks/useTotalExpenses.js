import { useMemo } from 'react'
import { useExpenses } from '../context/ExpenseContext'

/**
 * Custom hook to calculate total expenses
 * Memoized to avoid recalculation on every render
 */
export function useTotalExpenses() {
  const { expenses } = useExpenses()

  const total = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [expenses])

  return total
}

/**
 * Custom hook to get expenses by category
 * Wart: Not used anywhere yet, but could be useful
 */
export function useExpensesByCategory() {
  const { expenses } = useExpenses()

  const byCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const cat = expense.category
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(expense)
      return acc
    }, {})
  }, [expenses])

  return byCategory
}
