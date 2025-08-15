'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart,
  BarChart3,
  Settings,
  LogOut,
  User
} from 'lucide-react'
import { SummaryCards } from './summary-cards'
import { TransactionList } from './transaction-list'
import { ExpenseChart } from './expense-chart'
import { AddTransactionModal } from './add-transaction-modal'
import { LoadingSpinner } from './ui/loading-spinner'

export function Dashboard() {
  const { data: session } = useSession()
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/summary')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupDefaultCategories = async () => {
    try {
      await fetch('/api/setup', { method: 'POST' })
    } catch (error) {
      console.error('Error setting up categories:', error)
    }
  }

  useEffect(() => {
    // Setup default categories for new users
    setupDefaultCategories()
    // Then fetch summary
    fetchSummary()
  }, [])

  const handleTransactionAdded = () => {
    fetchSummary()
    setShowAddTransaction(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">FinanceApp</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddTransaction(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มรายการ</span>
              </button>
              
              <div className="flex items-center space-x-2">
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{session?.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Charts and Recent Transactions */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
            <ExpenseChart data={summary?.expensesByCategory || []} />
          </div>

          {/* Recent Transactions */}
          <div className="space-y-8">
            <TransactionList />
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransactionModal
          isOpen={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          onTransactionAdded={handleTransactionAdded}
        />
      )}
    </div>
  )
}
