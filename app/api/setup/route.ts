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

    // Create default categories for the user
    const categories = await Promise.all(
      defaultCategories.map(category =>
        prisma.category.create({
          data: {
            ...category,
            userId: user.id,
          },
        })
      )
    )

    return NextResponse.json({ 
      message: 'Default categories created successfully',
      categories 
    })
  } catch (error) {
    console.error('Error setting up default categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
