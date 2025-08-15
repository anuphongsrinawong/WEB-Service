'use client'

import { signIn } from 'next-auth/react'
import { 
  TrendingUp, 
  PieChart, 
  Target, 
  Shield, 
  Smartphone, 
  BarChart3 
} from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FinanceApp</span>
          </div>
          <button
            onClick={() => signIn('google')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            จัดการการเงินส่วนตัว
            <span className="text-blue-600"> อย่างง่ายดาย</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            ติดตามรายรับ-รายจ่าย วางแผนงบประมาณ และบรรลุเป้าหมายทางการเงินของคุณ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => signIn('google')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              เริ่มใช้งานฟรี
            </button>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              ดูตัวอย่าง
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<PieChart className="h-8 w-8" />}
            title="แดชบอร์ดรายรับ-รายจ่าย"
            description="ดูภาพรวมการเงินของคุณในหน้าเดียว พร้อมกราฟและสถิติที่เข้าใจง่าย"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="จัดหมวดหมู่อัตโนมัติ"
            description="แยกประเภทรายรับ-รายจ่ายอัตโนมัติ ช่วยให้คุณเข้าใจพฤติกรรมการใช้เงิน"
          />
          <FeatureCard
            icon={<Target className="h-8 w-8" />}
            title="ตั้งเป้าหมายการเงิน"
            description="กำหนดเป้าหมายการออม และติดตามความคืบหน้าแบบเรียลไทม์"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="ปลอดภัยสูง"
            description="ข้อมูลของคุณปลอดภัยด้วยระบบรักษาความปลอดภัยระดับธนาคาร"
          />
          <FeatureCard
            icon={<Smartphone className="h-8 w-8" />}
            title="ใช้งานง่าย"
            description="ออกแบบให้ใช้งานง่าย บนมือถือและคอมพิวเตอร์"
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8" />}
            title="รายงานแนวโน้ม"
            description="วิเคราะห์แนวโน้มการใช้จ่าย และให้คำแนะนำการจัดการเงิน"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xl font-bold">FinanceApp</span>
          </div>
          <p className="text-gray-400">
            © 2024 FinanceApp. สงวนลิขสิทธิ์ทุกประการ.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
