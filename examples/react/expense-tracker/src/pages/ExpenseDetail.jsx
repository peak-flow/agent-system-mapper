import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { expenseService } from '../services/expenseService'
import { useExpenses } from '../context/ExpenseContext'
import { formatCurrency, formatDate } from '../utils/formatters'

/**
 * ExpenseDetail page - shows single expense details
 * Wart: Fetches from service directly instead of using context
 */
function ExpenseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteExpense } = useExpenses()
  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadExpense()
  }, [id])

  async function loadExpense() {
    try {
      const data = await expenseService.getById(id)
      setExpense(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }
    try {
      await deleteExpense(id)
      navigate('/')
    } catch (err) {
      alert('Failed to delete')
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>
  if (!expense) return <p>Expense not found</p>

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>&larr; Back to list</Link>

      <div style={styles.card}>
        <h2>{expense.description}</h2>
        <p style={styles.amount}>{formatCurrency(expense.amount)}</p>
        <p style={styles.meta}>
          <span style={styles.category}>{expense.category}</span>
          <span>{formatDate(expense.createdAt)}</span>
        </p>

        <div style={styles.actions}>
          <button onClick={handleDelete} style={styles.deleteBtn}>
            Delete Expense
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '20px 0',
  },
  backLink: {
    color: '#666',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '20px',
  },
  card: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  amount: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#e53935',
    margin: '20px 0',
  },
  meta: {
    display: 'flex',
    gap: '15px',
    color: '#666',
    marginBottom: '30px',
  },
  category: {
    background: '#eee',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  actions: {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
  },
  deleteBtn: {
    background: '#f44336',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
}

export default ExpenseDetail
