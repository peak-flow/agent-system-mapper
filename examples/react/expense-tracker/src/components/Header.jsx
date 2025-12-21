import { Link } from 'react-router-dom'

/**
 * Header component - navigation bar
 */
function Header() {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>
        <Link to="/" style={styles.link}>Expense Tracker</Link>
      </h1>
      <nav>
        <Link to="/add" style={styles.addButton}>+ Add Expense</Link>
      </nav>
    </header>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0',
    borderBottom: '1px solid #ddd',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    margin: 0,
  },
  link: {
    color: 'inherit',
    textDecoration: 'none',
  },
  addButton: {
    background: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
  },
}

export default Header
