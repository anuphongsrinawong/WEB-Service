import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  // Income Categories
  { name: 'เงินเดือน', color: '#10B981', type: 'INCOME' as const },
  { name: 'โบนัส', color: '#059669', type: 'INCOME' as const },
  { name: 'รายได้เสริม', color: '#34D399', type: 'INCOME' as const },
  { name: 'ลงทุน', color: '#6EE7B7', type: 'INCOME' as const },

  // Expense Categories
  { name: 'อาหาร', color: '#EF4444', type: 'EXPENSE' as const },
  { name: 'ค่าเดินทาง', color: '#F97316', type: 'EXPENSE' as const },
  { name: 'ที่อยู่อาศัย', color: '#8B5CF6', type: 'EXPENSE' as const },
  { name: 'สุขภาพ', color: '#06B6D4', type: 'EXPENSE' as const },
  { name: 'การศึกษา', color: '#3B82F6', type: 'EXPENSE' as const },
  { name: 'ความบันเทิง', color: '#EC4899', type: 'EXPENSE' as const },
  { name: 'เสื้อผ้า', color: '#84CC16', type: 'EXPENSE' as const },
  { name: 'อื่นๆ', color: '#6B7280', type: 'EXPENSE' as const },
]

async function main() {
  console.log('Seeding default categories...')

  // This seed will create categories for users when they first sign up
  // Categories will be created per user through the API when they first add a transaction
  
  console.log('Seed completed. Categories will be created when users sign up.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export { defaultCategories }
