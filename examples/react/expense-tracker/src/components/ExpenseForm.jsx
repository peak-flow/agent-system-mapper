import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import { CATEGORIES } from '../utils/constants'

/**
 * ExpenseForm component - form for adding expenses
 */
function ExpenseForm() {
  const navigate = useNavigate()
  const { addExpense } = useExpenses()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: CATEGORIES[0],
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Wart: Basic validation only, no error messages shown
    if (!formData.description || !formData.amount) {
      return
    }

    setSubmitting(true)
    try {
      await addExpense({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
      })
      navigate('/')
    } catch (error) {
      alert('Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label htmlFor="description">Description</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="What did you spend on?"
          style={styles.input}
          required
        />
      </div>

      <div style={styles.field}>
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          style={styles.input}
          required
        />
      </div>

      <div style={styles.field}>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          style={styles.input}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={submitting} style={styles.button}>
        {submitting ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  )
}

const styles = {
  form: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  field: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '5px',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
}

export default ExpenseForm
