import ExpenseList from '../components/ExpenseList'
import { useExpenses } from '../context/ExpenseContext'
import { useTotalExpenses } from '../hooks/useTotalExpenses'
import { formatCurrency } from '../utils/formatters'

/**
 * Dashboard page - main view showing expense summary and list
 */
function Dashboard() {
  const { expenses } = useExpenses()
  const total = useTotalExpenses()

  return (
    <div>
      <div style={styles.summary}>
        <h2>Total Expenses</h2>
        <p style={styles.total}>{formatCurrency(total)}</p>
        <p style={styles.count}>{expenses.length} expense(s)</p>
      </div>

      <h3 style={styles.heading}>Recent Expenses</h3>
      <ExpenseList />
    </div>
  )
}

const styles = {
  summary: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  total: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#e53935',
    margin: '10px 0',
  },
  count: {
    color: '#666',
  },
  heading: {
    marginBottom: '15px',
  },
}

export default Dashboard
