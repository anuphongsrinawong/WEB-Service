'use client'

import { useState, useEffect } from 'react'
import { Plus, Target, Calendar, TrendingUp, Edit3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { LoadingSpinner } from './ui/loading-spinner'

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  progress: number
  remaining: number
  daysLeft: number
  description?: string
  targetDate: string
}

export function FinancialGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [newAmount, setNewAmount] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    description: '',
    targetDate: '',
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchGoals()
        setShowAddGoal(false)
        setFormData({
          name: '',
          targetAmount: '',
          currentAmount: '0',
          description: '',
          targetDate: '',
        })
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const updateGoalProgress = async (goalId: string, newCurrentAmount: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentAmount: newCurrentAmount }),
      })

      if (response.ok) {
        fetchGoals()
        setEditingGoal(null)
        setNewAmount('')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const getGoalStatus = (progress: number, daysLeft: number) => {
    if (progress >= 100) return { color: 'bg-green-500', text: 'สำเร็จ!' }
    if (daysLeft < 0) return { color: 'bg-red-500', text: 'หมดเวลา' }
    if (daysLeft <= 30) return { color: 'bg-yellow-500', text: 'ใกล้หมดเวลา' }
    return { color: 'bg-blue-500', text: 'กำลังดำเนินการ' }
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
          <Target className="h-5 w-5 text-green-600" />
          <span>เป้าหมายการเงิน</span>
        </h3>
        <button
          onClick={() => setShowAddGoal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มเป้าหมาย</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>ยังไม่มีเป้าหมายการเงิน</p>
          <p className="text-sm">กำหนดเป้าหมายเพื่อแรงบันดาลใจในการออม</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => {
            const status = getGoalStatus(goal.progress, goal.daysLeft)

            return (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{goal.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${status.color}`}>
                    {status.text}
                  </span>
                </div>

                {goal.description && (
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                )}

                {/* Progress Circle */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={goal.progress >= 100 ? "#10b981" : "#3b82f6"}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${Math.min(goal.progress, 100) * 2.51327} 251.327`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round(goal.progress)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">ปัจจุบัน</span>
                      <button
                        onClick={() => {
                          setEditingGoal(goal)
                          setNewAmount(goal.currentAmount.toString())
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      เป้าหมาย {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">เหลือ:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(goal.remaining)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>เวลาเหลือ:</span>
                    </span>
                    <span className={`font-medium ${goal.daysLeft > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      {goal.daysLeft > 0 ? `${goal.daysLeft} วัน` : 'หมดเวลาแล้ว'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">กำหนดเสร็จ:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(goal.targetDate).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เพิ่มเป้าหมายใหม่</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อเป้าหมาย
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ซื้อรถยนต์, ออมเงินฉุกเฉิน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงินเป้าหมาย (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงินปัจจุบัน (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำอธิบาย (ไม่บังคับ)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="เหตุผลหรือรายละเอียดของเป้าหมาย"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ต้องการให้สำเร็จ
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  สร้าง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Amount Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              อัปเดตจำนวนเงิน
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {editingGoal.name}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงินปัจจุบัน (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(null)
                    setNewAmount('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => updateGoalProgress(editingGoal.id, parseFloat(newAmount))}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  อัปเดต
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
