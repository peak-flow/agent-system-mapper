import { Link } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import { formatCurrency, formatDate } from '../utils/formatters'

/**
 * ExpenseItem component - single expense row
 */
function ExpenseItem({ expense }) {
  const { deleteExpense } = useExpenses()

  const handleDelete = async () => {
    // Wart: No confirmation dialog before delete
    try {
      await deleteExpense(expense.id)
    } catch (error) {
      alert('Failed to delete expense')
    }
  }

  return (
    <li style={styles.item}>
      <div style={styles.info}>
        <Link to={`/expense/${expense.id}`} style={styles.title}>
          {expense.description}
        </Link>
        <span style={styles.category}>{expense.category}</span>
        <span style={styles.date}>{formatDate(expense.createdAt)}</span>
      </div>
      <div style={styles.actions}>
        <span style={styles.amount}>{formatCurrency(expense.amount)}</span>
        <button onClick={handleDelete} style={styles.deleteBtn}>
          Delete
        </button>
      </div>
    </li>
  )
}

const styles = {
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: 'white',
    borderRadius: '4px',
    marginBottom: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    textDecoration: 'none',
  },
  category: {
    fontSize: '12px',
    color: '#666',
    background: '#eee',
    padding: '2px 8px',
    borderRadius: '10px',
    width: 'fit-content',
  },
  date: {
    fontSize: '12px',
    color: '#999',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  amount: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#e53935',
  },
  deleteBtn: {
    background: '#f44336',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
}

export default ExpenseItem
