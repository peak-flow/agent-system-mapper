import ExpenseItem from './ExpenseItem'
import { useExpenses } from '../context/ExpenseContext'

/**
 * ExpenseList component - displays list of expenses
 */
function ExpenseList() {
  const { expenses, loading, error } = useExpenses()

  if (loading) {
    return <p>Loading expenses...</p>
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>
  }

  if (expenses.length === 0) {
    return <p>No expenses yet. Add your first expense!</p>
  }

  return (
    <ul style={styles.list}>
      {expenses.map((expense) => (
        <ExpenseItem key={expense.id} expense={expense} />
      ))}
    </ul>
  )
}

const styles = {
  list: {
    listStyle: 'none',
    padding: 0,
  },
}

export default ExpenseList
