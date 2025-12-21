import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import ExpenseDetail from './pages/ExpenseDetail'

/**
 * Main App component
 * Sets up routing and layout
 */
function App() {
  return (
    <div className="container">
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<AddExpense />} />
        <Route path="/expense/:id" element={<ExpenseDetail />} />
      </Routes>
    </div>
  )
}

export default App
