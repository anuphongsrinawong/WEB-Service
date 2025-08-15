import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Default to current month/year if not provided
    const currentDate = new Date()
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1
    const targetYear = year ? parseInt(year) : currentDate.getFullYear()

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0)

    // Get income and expense totals
    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId: user.id,
          type: 'INCOME',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: user.id,
          type: 'EXPENSE',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    // Get category breakdown
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: user.id,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get category details
    const categoryDetails = await prisma.category.findMany({
      where: {
        id: {
          in: categoryBreakdown.map(cb => cb.categoryId).filter(Boolean) as string[],
        },
      },
    })

    // Combine category data
    const expensesByCategory = categoryBreakdown.map(breakdown => {
      const category = categoryDetails.find(c => c.id === breakdown.categoryId)
      return {
        categoryId: breakdown.categoryId,
        categoryName: category?.name || 'ไม่ระบุหมวดหมู่',
        amount: breakdown._sum.amount || 0,
        color: category?.color || '#6B7280',
      }
    })

    const totalIncome = income._sum.amount || 0
    const totalExpenses = expenses._sum.amount || 0
    const balance = totalIncome - totalExpenses

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      balance,
      expensesByCategory,
      period: {
        month: targetMonth,
        year: targetYear,
      },
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
