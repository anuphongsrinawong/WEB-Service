'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calendar, Edit3, Trash2, MoreHorizontal } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { LoadingSpinner } from './ui/loading-spinner'

interface Transaction {
  id: string
  amount: number
  description: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  category?: {
    name: string
    color: string
  }
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState<string | null>(null)

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions?limit=10')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleDelete = async (transactionId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTransactions()
        setShowMenu(null)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">รายการล่าสุด</h3>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">รายการล่าสุด</h3>
        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
          ดูทั้งหมด
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          ยังไม่มีรายการ
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'INCOME' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {transaction.type === 'INCOME' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.description}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatShortDate(new Date(transaction.date))}</span>
                    {transaction.category && (
                      <>
                        <span>•</span>
                        <span 
                          className="px-2 py-1 rounded text-xs"
                          style={{ 
                            backgroundColor: transaction.category.color + '20',
                            color: transaction.category.color 
                          }}
                        >
                          {transaction.category.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`font-semibold ${
                  transaction.type === 'INCOME' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transaction.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
                
                {/* Action Menu */}
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowMenu(showMenu === transaction.id ? null : transaction.id)}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </button>
                  
                  {showMenu === transaction.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          // TODO: Implement edit functionality
                          console.log('Edit transaction:', transaction.id)
                          setShowMenu(null)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
