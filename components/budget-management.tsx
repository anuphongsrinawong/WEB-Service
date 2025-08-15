'use client'

import { useState, useEffect } from 'react'
import { Plus, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { LoadingSpinner } from './ui/loading-spinner'

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  remaining: number
  percentage: number
  categoryId?: string
  category?: {
    name: string
    color: string
  }
  startDate: string
  endDate: string
}

interface Category {
  id: string
  name: string
  color: string
  type: string
}

export function BudgetManagement() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [])

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=EXPENSE')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchBudgets()
        setShowAddBudget(false)
        setFormData({
          name: '',
          amount: '',
          categoryId: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        })
      }
    } catch (error) {
      console.error('Error creating budget:', error)
    }
  }

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { color: 'bg-red-500', icon: AlertTriangle, text: 'เกินงบ' }
    if (percentage >= 80) return { color: 'bg-yellow-500', icon: AlertTriangle, text: 'ใกล้เกิน' }
    return { color: 'bg-green-500', icon: CheckCircle, text: 'ปกติ' }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span>งบประมาณ</span>
        </h3>
        <button
          onClick={() => setShowAddBudget(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มงบประมาณ</span>
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>ยังไม่มีงบประมาณ</p>
          <p className="text-sm">เริ่มต้นวางแผนการเงินของคุณ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget.percentage)
            const StatusIcon = status.icon

            return (
              <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: budget.category?.color || '#6B7280' }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{budget.name}</h4>
                      <p className="text-sm text-gray-500">
                        {budget.category?.name || 'ทั้งหมด'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 text-white`} />
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">
                      ใช้ไป {formatCurrency(budget.spent)} จาก {formatCurrency(budget.amount)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {budget.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status.color}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className={`${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {budget.remaining >= 0 ? 'เหลือ ' : 'เกิน '}
                    {formatCurrency(Math.abs(budget.remaining))}
                  </span>
                  <span className="text-gray-500">
                    {new Date(budget.startDate).toLocaleDateString('th-TH')} - {new Date(budget.endDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มงบประมาณใหม่</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่องบประมาณ
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">ทั้งหมด</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่เริ่ม
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBudget(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  สร้าง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
