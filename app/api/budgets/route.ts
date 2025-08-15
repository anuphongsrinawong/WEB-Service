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

    const currentDate = new Date()
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1
    const targetYear = year ? parseInt(year) : currentDate.getFullYear()

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0)

    // Get budgets for the period
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
      },
      include: {
        category: true,
      },
    })

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spending = await prisma.transaction.aggregate({
          where: {
            userId: user.id,
            type: 'EXPENSE',
            categoryId: budget.categoryId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        })

        return {
          ...budget,
          spent: spending._sum.amount || 0,
          remaining: budget.amount - (spending._sum.amount || 0),
          percentage: budget.amount > 0 ? ((spending._sum.amount || 0) / budget.amount) * 100 : 0,
        }
      })
    )

    return NextResponse.json(budgetsWithSpending)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const body = await request.json()
    const { name, amount, categoryId, startDate, endDate } = body

    const budget = await prisma.budget.create({
      data: {
        name,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: user.id,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
