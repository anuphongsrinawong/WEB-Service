import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { defaultCategories } from '@/prisma/seed'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has categories
    const existingCategories = await prisma.category.findMany({
      where: { userId: user.id }
    })

    if (existingCategories.length > 0) {
      return NextResponse.json({ message: 'Categories already exist' })
    }

    // Create default categories for the user using upsert (safer)
    const categories = []
    
    for (const category of defaultCategories) {
      try {
        const createdCategory = await prisma.category.upsert({
          where: {
            name_userId: {
              name: category.name,
              userId: user.id,
            },
          },
          update: {}, // ไม่อัปเดตถ้ามีอยู่แล้ว
          create: {
            ...category,
            userId: user.id,
          },
        })
        categories.push(createdCategory)
      } catch (error) {
        console.log(`Category ${category.name} already exists for user`)
      }
    }

    return NextResponse.json({ 
      message: 'Default categories setup completed',
      categoriesCreated: categories.length
    })
  } catch (error) {
    console.error('Error setting up default categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
