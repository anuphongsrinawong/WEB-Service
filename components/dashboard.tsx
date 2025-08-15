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
  User,
  Target,
  CreditCard
} from 'lucide-react'
import { SummaryCards } from './summary-cards'
import { TransactionList } from './transaction-list'
import { ExpenseChart } from './expense-chart'
import { AddTransactionModal } from './add-transaction-modal'
import { BudgetManagement } from './budget-management'
import { FinancialGoals } from './financial-goals'
import { TransactionSearch } from './transaction-search'
import { ExportData } from './export-data'
import { DebtManagement } from './debt-management'
import { CategoryManagement } from './category-management'
import { LoadingSpinner } from './ui/loading-spinner'
import { formatCurrency } from '@/lib/utils'

export function Dashboard() {
  const { data: session } = useSession()
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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

  // Financial Health Score Calculation (0-100)
  const getFinancialHealthScore = (summary: any) => {
    if (!summary) return 0
    
    let score = 50 // Base score
    
    // Positive factors
    if (summary.totalIncome > summary.totalExpense) score += 20 // Positive cash flow
    if (summary.totalIncome > 0) {
      const savingsRate = ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100
      if (savingsRate > 20) score += 15 // Good savings rate
      else if (savingsRate > 10) score += 10
      else if (savingsRate > 0) score += 5
    }
    if ((summary.totalDebt || 0) === 0) score += 15 // No debt
    
    // Negative factors
    if (summary.totalExpense > summary.totalIncome) score -= 20 // Spending more than earning
    if ((summary.totalDebt || 0) > (summary.totalIncome || 0)) score -= 15 // High debt-to-income ratio
    
    return Math.max(0, Math.min(100, score))
  }

  const getHealthScoreText = (score: number) => {
    if (score >= 80) return "ดีเยี่ยม"
    if (score >= 60) return "ดี"
    if (score >= 40) return "ปานกลาง"
    if (score >= 20) return "ต้องปรับปรุง"
    return "ต้องดูแลเร่งด่วน"
  }

  const getRecentActivities = (summary: any) => {
    if (!summary?.recentTransactions) return []
    
    return summary.recentTransactions.slice(0, 5).map((transaction: any) => ({
      title: transaction.description,
      time: new Date(transaction.date).toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
      amount: transaction.type === 'INCOME' ? transaction.amount : -transaction.amount,
      icon: transaction.type === 'INCOME' ? TrendingUp : TrendingDown,
      color: transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'
    }))
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
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'ภาพรวม', icon: BarChart3 },
              { id: 'transactions', name: 'รายการ', icon: TrendingUp },
              { id: 'categories', name: 'หมวดหมู่', icon: PieChart },
              { id: 'budget', name: 'งบประมาณ', icon: Target },
              { id: 'goals', name: 'เป้าหมาย', icon: Target },
              { id: 'debts', name: 'หนี้', icon: CreditCard },
              { id: 'export', name: 'ส่งออก', icon: TrendingDown },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => setShowAddTransaction(true)}
                className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-700 transition-colors">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-700">เพิ่มรายการ</span>
              </button>

              <button
                onClick={() => setActiveTab('budget')}
                className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
              >
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-700 transition-colors">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-700">งบประมาณ</span>
              </button>

              <button
                onClick={() => setActiveTab('goals')}
                className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-purple-700 transition-colors">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-700">เป้าหมาย</span>
              </button>

              <button
                onClick={() => setActiveTab('debts')}
                className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group"
              >
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-orange-700 transition-colors">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-orange-700">หนี้</span>
              </button>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Summary Cards - Take 3 columns */}
              <div className="lg:col-span-3">
                <SummaryCards summary={summary} />
              </div>

              {/* Financial Health Score - Take 1 column */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">คะแนนสุขภาพการเงิน</h3>
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeDasharray={`${getFinancialHealthScore(summary)}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">
                        {Math.round(getFinancialHealthScore(summary))}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getHealthScoreText(getFinancialHealthScore(summary))}
                  </p>
                </div>
              </div>
            </div>

            {/* Charts and Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Charts */}
              <div className="lg:col-span-2">
                <ExpenseChart data={summary?.expensesByCategory || []} />
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
                <div className="space-y-4">
                  {getRecentActivities(summary).length > 0 ? (
                    getRecentActivities(summary).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color}`}>
                          <activity.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        <span className={`text-sm font-medium ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>ยังไม่มีกิจกรรม</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                <p className="text-2xl font-bold text-blue-600">{summary?.todayTransactions || 0}</p>
                <p className="text-sm text-gray-600">รายการวันนี้</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round(summary?.budgetUsage || 0)}%</p>
                <p className="text-sm text-gray-600">งบประมาณที่ใช้</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                <p className="text-2xl font-bold text-purple-600">{summary?.completedGoals || 0}</p>
                <p className="text-sm text-gray-600">เป้าหมายที่บรรลุ</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary?.totalDebt || 0)}</p>
                <p className="text-sm text-gray-600">หนี้คงเหลือ</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <TransactionList />
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <TransactionSearch />
        )}

        {activeTab === 'categories' && (
          <CategoryManagement />
        )}

        {activeTab === 'budget' && (
          <BudgetManagement />
        )}

        {activeTab === 'goals' && (
          <FinancialGoals />
        )}

        {activeTab === 'debts' && (
          <DebtManagement />
        )}

        {activeTab === 'export' && (
          <ExportData />
        )}
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
