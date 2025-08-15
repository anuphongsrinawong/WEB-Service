'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, Users, AlertTriangle, CheckCircle, Calendar, DollarSign, TrendingDown, TrendingUp, Edit3, Trash2, MoreHorizontal } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LoadingSpinner } from './ui/loading-spinner'

interface Debt {
  id: string
  name: string
  type: 'OWE' | 'LEND'
  totalAmount: number
  remainingAmount: number
  totalPaid: number
  progressPercentage: number
  interestRate?: number
  creditorName?: string
  description?: string
  startDate: string
  dueDate?: string
  currentStatus: string
  daysUntilDue?: number
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    description?: string
  }>
  _count: {
    payments: number
  }
}

interface DebtSummary {
  overview: {
    totalOweAmount: number
    totalLendAmount: number
    totalOwePaid: number
    totalLendReceived: number
    totalOweRemaining: number
    totalLendRemaining: number
    activeOweDebts: number
    activeLendDebts: number
    overdueDebts: number
    netPosition: number
  }
  debtBreakdown: Array<{
    type: string
    count: number
    totalAmount: number
  }>
  recentPayments: Array<{
    id: string
    amount: number
    paymentDate: string
    description?: string
    debt: {
      name: string
      type: string
    }
  }>
}

export function DebtManagement() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [summary, setSummary] = useState<DebtSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddDebt, setShowAddDebt] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  
  const [debtFormData, setDebtFormData] = useState({
    name: '',
    type: 'OWE' as 'OWE' | 'LEND',
    totalAmount: '',
    interestRate: '',
    creditorName: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  })

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => {
    fetchDebts()
    fetchSummary()
  }, [])

  const fetchDebts = async () => {
    try {
      const response = await fetch('/api/debts')
      if (response.ok) {
        const data = await response.json()
        setDebts(data)
      }
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/debts/summary')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching debt summary:', error)
    }
  }

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(debtFormData),
      })

      if (response.ok) {
        fetchDebts()
        fetchSummary()
        setShowAddDebt(false)
        setDebtFormData({
          name: '',
          type: 'OWE',
          totalAmount: '',
          interestRate: '',
          creditorName: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: '',
        })
      }
    } catch (error) {
      console.error('Error creating debt:', error)
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!showAddPayment) return

    try {
      const response = await fetch(`/api/debts/${showAddPayment}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentFormData),
      })

      if (response.ok) {
        fetchDebts()
        fetchSummary()
        setShowAddPayment(null)
        setPaymentFormData({
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          description: '',
        })
      }
    } catch (error) {
      console.error('Error adding payment:', error)
    }
  }

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบหนี้นี้? การดำเนินการนี้จะลบรายการชำระทั้งหมดด้วย')) return

    try {
      const response = await fetch(`/api/debts/${debtId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDebts()
        fetchSummary()
        setShowMenu(null)
      }
    } catch (error) {
      console.error('Error deleting debt:', error)
    }
  }

  const handleEditDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingDebt) return

    try {
      const response = await fetch(`/api/debts/${editingDebt.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(debtFormData),
      })

      if (response.ok) {
        fetchDebts()
        fetchSummary()
        setEditingDebt(null)
        setDebtFormData({
          name: '',
          type: 'OWE',
          totalAmount: '',
          interestRate: '',
          creditorName: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: '',
        })
      }
    } catch (error) {
      console.error('Error updating debt:', error)
    }
  }

  const getDebtStatusColor = (status: string, type: string) => {
    switch (status) {
      case 'PAID_OFF':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return type === 'OWE' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
    }
  }

  const getDebtStatusText = (status: string) => {
    switch (status) {
      case 'PAID_OFF':
        return 'ชำระครบแล้ว'
      case 'OVERDUE':
        return 'เกินกำหนด'
      case 'ACTIVE':
        return 'กำลังดำเนินการ'
      default:
        return status
    }
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
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">หนี้ที่ต้องจ่าย</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.overview.totalOweRemaining)}
                </p>
                <p className="text-xs text-gray-400">
                  {summary.overview.activeOweDebts} รายการ
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">หนี้ที่จะได้รับ</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.overview.totalLendRemaining)}
                </p>
                <p className="text-xs text-gray-400">
                  {summary.overview.activeLendDebts} รายการ
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">ตำแหน่งสุทธิ</p>
                <p className={`text-2xl font-bold ${
                  summary.overview.netPosition >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary.overview.netPosition)}
                </p>
                <p className="text-xs text-gray-400">
                  {summary.overview.netPosition >= 0 ? 'เป็นประโยชน์' : 'เป็นหนี้'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                summary.overview.netPosition >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  summary.overview.netPosition >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">เกินกำหนด</p>
                <p className="text-2xl font-bold text-orange-600">
                  {summary.overview.overdueDebts}
                </p>
                <p className="text-xs text-gray-400">รายการ</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <span>จัดการหนี้</span>
          </h3>
          <button
            onClick={() => setShowAddDebt(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มหนี้</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            {[
              { id: 'overview', name: 'ภาพรวม' },
              { id: 'owe', name: 'หนี้ที่ต้องจ่าย' },
              { id: 'lend', name: 'หนี้ที่จะได้รับ' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Recent Payments */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">รายการชำระล่าสุด</h4>
              {summary.recentPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">ยังไม่มีรายการชำระ</p>
              ) : (
                <div className="space-y-3">
                  {summary.recentPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          payment.debt.type === 'OWE' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {payment.debt.type === 'OWE' ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.debt.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(new Date(payment.paymentDate))}
                          </p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        payment.debt.type === 'OWE' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(activeTab === 'owe' || activeTab === 'lend') && (
          <div className="space-y-4">
            {debts
              .filter(debt => 
                activeTab === 'owe' ? debt.type === 'OWE' : debt.type === 'LEND'
              )
              .filter(debt => debt.remainingAmount > 0 || debt.currentStatus === 'PAID_OFF')
              .map((debt) => (
                <div key={debt.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{debt.name}</h4>
                        {debt.creditorName && (
                          <p className="text-sm text-gray-500">
                            {debt.type === 'OWE' ? 'เจ้าหนี้: ' : 'ลูกหนี้: '}{debt.creditorName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getDebtStatusColor(debt.currentStatus, debt.type)}`}>
                        {getDebtStatusText(debt.currentStatus)}
                      </span>
                      {debt.currentStatus !== 'PAID_OFF' && (
                        <button
                          onClick={() => setShowAddPayment(debt.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          ชำระ
                        </button>
                      )}
                      
                      {/* Action Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(showMenu === debt.id ? null : debt.id)}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {showMenu === debt.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              onClick={() => {
                                setEditingDebt(debt)
                                setDebtFormData({
                                  name: debt.name,
                                  type: debt.type,
                                  totalAmount: debt.totalAmount.toString(),
                                  interestRate: debt.interestRate?.toString() || '',
                                  creditorName: debt.creditorName || '',
                                  description: debt.description || '',
                                  startDate: debt.startDate.split('T')[0],
                                  dueDate: debt.dueDate?.split('T')[0] || '',
                                })
                                setShowMenu(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
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

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        ชำระแล้ว {formatCurrency(debt.totalPaid)} จาก {formatCurrency(debt.totalAmount)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {debt.progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(debt.progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">คงเหลือ:</span>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(debt.remainingAmount)}
                      </p>
                    </div>
                    {debt.interestRate && (
                      <div>
                        <span className="text-gray-500">ดอกเบี้ย:</span>
                        <p className="font-medium text-gray-900">
                          {debt.interestRate}% ต่อปี
                        </p>
                      </div>
                    )}
                    {debt.dueDate && (
                      <div>
                        <span className="text-gray-500">ครบกำหนด:</span>
                        <p className={`font-medium ${
                          debt.daysUntilDue !== null && debt.daysUntilDue !== undefined && debt.daysUntilDue < 0 
                            ? 'text-red-600' 
                            : debt.daysUntilDue !== null && debt.daysUntilDue !== undefined && debt.daysUntilDue <= 30
                              ? 'text-orange-600'
                              : 'text-gray-900'
                        }`}>
                          {formatDate(new Date(debt.dueDate))}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">รายการชำระ:</span>
                      <p className="font-medium text-gray-900">
                        {debt._count.payments} ครั้ง
                      </p>
                    </div>
                  </div>

                  {/* Recent Payments */}
                  {debt.payments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">รายการชำระล่าสุด:</p>
                      <div className="space-y-1">
                        {debt.payments.slice(0, 3).map((payment) => (
                          <div key={payment.id} className="flex justify-between text-xs text-gray-600">
                            <span>{formatDate(new Date(payment.paymentDate))}</span>
                            <span>{formatCurrency(payment.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {debts.filter(debt => 
              activeTab === 'owe' ? debt.type === 'OWE' : debt.type === 'LEND'
            ).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>ยังไม่มี{activeTab === 'owe' ? 'หนี้ที่ต้องจ่าย' : 'หนี้ที่จะได้รับ'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      {(showAddDebt || editingDebt) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingDebt ? 'แก้ไขหนี้' : 'เพิ่มหนี้ใหม่'}
            </h3>
            
            <form onSubmit={editingDebt ? handleEditDebt : handleAddDebt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อหนี้
                </label>
                <input
                  type="text"
                  value={debtFormData.name}
                  onChange={(e) => setDebtFormData({ ...debtFormData, name: e.target.value })}
                  placeholder="เช่น สินเชื่อบ้าน, บัตรเครดิต"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภท
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDebtFormData({ ...debtFormData, type: 'OWE' })}
                    className={`p-3 rounded-lg border text-center ${
                      debtFormData.type === 'OWE'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    เราเป็นหนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtFormData({ ...debtFormData, type: 'LEND' })}
                    className={`p-3 rounded-lg border text-center ${
                      debtFormData.type === 'LEND'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    คนอื่นเป็นหนี้เรา
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงินรวม (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={debtFormData.totalAmount}
                  onChange={(e) => setDebtFormData({ ...debtFormData, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {debtFormData.type === 'OWE' ? 'ชื่อเจ้าหนี้' : 'ชื่อลูกหนี้'} (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={debtFormData.creditorName}
                  onChange={(e) => setDebtFormData({ ...debtFormData, creditorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อัตราดอกเบี้ย (% ต่อปี) (ไม่บังคับ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={debtFormData.interestRate}
                  onChange={(e) => setDebtFormData({ ...debtFormData, interestRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่เริ่มหนี้
                  </label>
                  <input
                    type="date"
                    value={debtFormData.startDate}
                    onChange={(e) => setDebtFormData({ ...debtFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันครบกำหนด (ไม่บังคับ)
                  </label>
                  <input
                    type="date"
                    value={debtFormData.dueDate}
                    onChange={(e) => setDebtFormData({ ...debtFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รายละเอียดเพิ่มเติม (ไม่บังคับ)
                </label>
                <textarea
                  value={debtFormData.description}
                  onChange={(e) => setDebtFormData({ ...debtFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDebt(false)
                    setEditingDebt(null)
                    setDebtFormData({
                      name: '',
                      type: 'OWE',
                      totalAmount: '',
                      interestRate: '',
                      creditorName: '',
                      description: '',
                      startDate: new Date().toISOString().split('T')[0],
                      dueDate: '',
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingDebt ? 'อัปเดต' : 'เพิ่มหนี้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">บันทึกการชำระ</h3>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ชำระ
                </label>
                <input
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={paymentFormData.description}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
