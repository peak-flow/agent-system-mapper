import ExpenseForm from '../components/ExpenseForm'

/**
 * AddExpense page - form for adding new expenses
 */
function AddExpense() {
  return (
    <div>
      <h2 style={styles.heading}>Add New Expense</h2>
      <ExpenseForm />
    </div>
  )
}

const styles = {
  heading: {
    marginBottom: '20px',
  },
}

export default AddExpense
