import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { name, color, icon, type } = await request.json()

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check for duplicate name (excluding current category)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name,
        userId: user.id,
        NOT: {
          id: params.id,
        },
      },
    })

    if (duplicateCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
    }

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        color,
        icon,
        type,
      },
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        transactions: true,
        budgets: true,
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category is being used
    if (category.transactions.length > 0 || category.budgets.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category that is being used in transactions or budgets' 
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
