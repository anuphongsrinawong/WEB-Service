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

    // Get today's transactions count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTransactionsCount = await prisma.transaction.count({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Get recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    })

    // Get total debt
    const totalDebt = await prisma.debt.aggregate({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      _sum: {
        remainingAmount: true,
      },
    })

    // Get budget usage (average percentage)
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    })

    let totalBudgetUsage = 0
    let budgetCount = 0

    for (const budget of budgets) {
      const budgetExpenses = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          type: 'EXPENSE',
          categoryId: budget.categoryId || undefined,
          date: {
            gte: new Date(Math.max(startDate.getTime(), new Date(budget.startDate).getTime())),
            lte: new Date(Math.min(endDate.getTime(), new Date(budget.endDate).getTime())),
          },
        },
        _sum: {
          amount: true,
        },
      })

      const spent = budgetExpenses._sum.amount || 0
      const usage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      totalBudgetUsage += usage
      budgetCount++
    }

    const averageBudgetUsage = budgetCount > 0 ? totalBudgetUsage / budgetCount : 0

    // Get completed goals count
    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
      },
      select: {
        currentAmount: true,
        targetAmount: true,
      },
    })

    const completedGoals = goals.filter(goal => goal.currentAmount >= goal.targetAmount).length

    return NextResponse.json({
      totalIncome,
      totalExpense: totalExpenses,
      totalExpenses, // Keep for backward compatibility
      balance,
      expensesByCategory,
      period: {
        month: targetMonth,
        year: targetYear,
      },
      // New fields
      todayTransactions: todayTransactionsCount,
      recentTransactions,
      totalDebt: totalDebt._sum.remainingAmount || 0,
      budgetUsage: averageBudgetUsage,
      completedGoals,
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
