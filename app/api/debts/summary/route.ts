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

    // Get all debts
    const debts = await prisma.debt.findMany({
      where: { userId: user.id },
      include: {
        payments: true,
      },
    })

    // Calculate summary statistics
    let totalOweAmount = 0
    let totalLendAmount = 0
    let totalOwePaid = 0
    let totalLendReceived = 0
    let activeOweDebts = 0
    let activeLendDebts = 0
    let overdueDebts = 0

    const now = new Date()

    debts.forEach(debt => {
      const totalPaid = debt.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const remainingAmount = Math.max(0, debt.totalAmount - totalPaid)
      
      // Check if overdue
      if (debt.dueDate && new Date(debt.dueDate) < now && remainingAmount > 0) {
        overdueDebts++
      }

      if (debt.type === 'OWE') {
        totalOweAmount += debt.totalAmount
        totalOwePaid += totalPaid
        if (remainingAmount > 0) activeOweDebts++
      } else if (debt.type === 'LEND') {
        totalLendAmount += debt.totalAmount
        totalLendReceived += totalPaid
        if (remainingAmount > 0) activeLendDebts++
      }
    })

    // Get recent payments
    const recentPayments = await prisma.debtPayment.findMany({
      where: { userId: user.id },
      include: {
        debt: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    })

    // Calculate debt breakdown by type
    const debtBreakdown = debts.reduce((acc, debt) => {
      const totalPaid = debt.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const remainingAmount = Math.max(0, debt.totalAmount - totalPaid)
      
      if (remainingAmount > 0) {
        const existing = acc.find(item => item.type === debt.type)
        if (existing) {
          existing.count++
          existing.totalAmount += remainingAmount
        } else {
          acc.push({
            type: debt.type,
            count: 1,
            totalAmount: remainingAmount,
          })
        }
      }
      
      return acc
    }, [] as Array<{ type: string; count: number; totalAmount: number }>)

    return NextResponse.json({
      overview: {
        totalOweAmount,
        totalLendAmount,
        totalOwePaid,
        totalLendReceived,
        totalOweRemaining: totalOweAmount - totalOwePaid,
        totalLendRemaining: totalLendAmount - totalLendReceived,
        activeOweDebts,
        activeLendDebts,
        overdueDebts,
        netPosition: (totalLendAmount - totalLendReceived) - (totalOweAmount - totalOwePaid), // Positive means people owe us more
      },
      debtBreakdown,
      recentPayments,
    })
  } catch (error) {
    console.error('Error fetching debt summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
