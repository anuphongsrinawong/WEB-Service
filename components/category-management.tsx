'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, MoreHorizontal, TrendingUp, TrendingDown, Tag } from 'lucide-react'
import { LoadingSpinner } from './ui/loading-spinner'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: 'INCOME' | 'EXPENSE'
  _count?: {
    transactions: number
    budgets: number
  }
}

interface CategoryFormData {
  name: string
  color: string
  icon: string
  type: 'INCOME' | 'EXPENSE'
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: '#3B82F6',
    icon: 'tag',
    type: 'EXPENSE',
  })

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ]

  const iconOptions = [
    'tag', 'shopping-cart', 'home', 'car', 'utensils',
    'medical-cross', 'graduation-cap', 'briefcase', 'heart',
    'plane', 'gamepad-2', 'shirt'
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCategories()
        setShowAddCategory(false)
        setFormData({
          name: '',
          color: '#3B82F6',
          icon: 'tag',
          type: 'EXPENSE',
        })
      } else {
        const error = await response.json()
        alert(error.error || 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('เกิดข้อผิดพลาดในการสร้างหมวดหมู่')
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchCategories()
        setEditingCategory(null)
        setFormData({
          name: '',
          color: '#3B82F6',
          icon: 'tag',
          type: 'EXPENSE',
        })
      } else {
        const error = await response.json()
        alert(error.error || 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    const hasUsage = (category._count?.transactions || 0) > 0 || (category._count?.budgets || 0) > 0
    
    if (hasUsage) {
      alert('ไม่สามารถลบหมวดหมู่ที่มีการใช้งานในรายการหรืองบประมาณได้')
      return
    }

    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${category.name}"?`)) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCategories()
        setShowMenu(null)
      } else {
        const error = await response.json()
        alert(error.error || 'เกิดข้อผิดพลาดในการลบหมวดหมู่')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('เกิดข้อผิดพลาดในการลบหมวดหมู่')
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'tag': Tag,
      'shopping-cart': Tag,
      'home': Tag,
      'car': Tag,
      'utensils': Tag,
      'medical-cross': Tag,
      'graduation-cap': Tag,
      'briefcase': Tag,
      'heart': Tag,
      'plane': Tag,
      'gamepad-2': Tag,
      'shirt': Tag,
    }
    
    const IconComponent = iconMap[iconName] || Tag
    return <IconComponent className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  const incomeCategories = categories.filter(cat => cat.type === 'INCOME')
  const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE')

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">จัดการหมวดหมู่</h2>
        <button
          onClick={() => setShowAddCategory(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มหมวดหมู่</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>ยังไม่มีหมวดหมู่</p>
          <p className="text-sm">เริ่มต้นสร้างหมวดหมู่สำหรับจัดระเบียบรายการ</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Income Categories */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">หมวดหมู่รายรับ</h3>
              <span className="text-sm text-gray-500">({incomeCategories.length} หมวดหมู่)</span>
            </div>
            
            {incomeCategories.length === 0 ? (
              <p className="text-gray-500 text-sm ml-7">ยังไม่มีหมวดหมู่รายรับ</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
                {incomeCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          {getIconComponent(category.icon)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-xs text-gray-500">
                            {category._count?.transactions || 0} รายการ • {category._count?.budgets || 0} งบประมาณ
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowMenu(showMenu === category.id ? null : category.id)}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {showMenu === category.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              onClick={() => {
                                setEditingCategory(category)
                                setFormData({
                                  name: category.name,
                                  color: category.color,
                                  icon: category.icon,
                                  type: category.type,
                                })
                                setShowMenu(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
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

          {/* Expense Categories */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">หมวดหมู่รายจ่าย</h3>
              <span className="text-sm text-gray-500">({expenseCategories.length} หมวดหมู่)</span>
            </div>
            
            {expenseCategories.length === 0 ? (
              <p className="text-gray-500 text-sm ml-7">ยังไม่มีหมวดหมู่รายจ่าย</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          {getIconComponent(category.icon)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          <p className="text-xs text-gray-500">
                            {category._count?.transactions || 0} รายการ • {category._count?.budgets || 0} งบประมาณ
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowMenu(showMenu === category.id ? null : category.id)}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {showMenu === category.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              onClick={() => {
                                setEditingCategory(category)
                                setFormData({
                                  name: category.name,
                                  color: category.color,
                                  icon: category.icon,
                                  type: category.type,
                                })
                                setShowMenu(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
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
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {(showAddCategory || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
            </h3>
            
            <form onSubmit={editingCategory ? handleEditCategory : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อหมวดหมู่
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น อาหาร, เงินเดือน"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภท
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="EXPENSE">รายจ่าย</option>
                  <option value="INCOME">รายรับ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สี
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ไอคอน
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                        formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      {getIconComponent(icon)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategory(false)
                    setEditingCategory(null)
                    setFormData({
                      name: '',
                      color: '#3B82F6',
                      icon: 'tag',
                      type: 'EXPENSE',
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'อัปเดต' : 'สร้าง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
