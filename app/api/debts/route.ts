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
    const type = searchParams.get('type') // 'OWE' or 'LEND'
    const status = searchParams.get('status') // 'ACTIVE', 'PAID_OFF', 'OVERDUE'

    const where: any = { userId: user.id }
    if (type) where.type = type
    if (status) where.status = status

    const debts = await prisma.debt.findMany({
      where,
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 5, // Latest 5 payments
        },
        _count: {
          select: { payments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate additional fields for each debt
    const debtsWithCalculations = debts.map(debt => {
      const totalPaid = debt.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const remainingAmount = debt.totalAmount - totalPaid
      const progressPercentage = debt.totalAmount > 0 ? (totalPaid / debt.totalAmount) * 100 : 0
      
      // Calculate days until due date
      const daysUntilDue = debt.dueDate 
        ? Math.ceil((new Date(debt.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      // Update status based on current state
      let currentStatus = debt.status
      if (remainingAmount <= 0) {
        currentStatus = 'PAID_OFF'
      } else if (debt.dueDate && daysUntilDue !== null && daysUntilDue < 0) {
        currentStatus = 'OVERDUE'
      }

      return {
        ...debt,
        totalPaid,
        remainingAmount: Math.max(0, remainingAmount),
        progressPercentage: Math.min(100, progressPercentage),
        daysUntilDue,
        currentStatus,
      }
    })

    return NextResponse.json(debtsWithCalculations)
  } catch (error) {
    console.error('Error fetching debts:', error)
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
    const { 
      name, 
      type, 
      totalAmount, 
      interestRate, 
      creditorName, 
      description, 
      startDate, 
      dueDate 
    } = body

    const debt = await prisma.debt.create({
      data: {
        name,
        type,
        totalAmount: parseFloat(totalAmount),
        remainingAmount: parseFloat(totalAmount), // Initially equals totalAmount
        interestRate: interestRate ? parseFloat(interestRate) : null,
        creditorName: creditorName || null,
        description: description || null,
        startDate: new Date(startDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id,
      },
      include: {
        payments: true,
      },
    })

    return NextResponse.json(debt, { status: 201 })
  } catch (error) {
    console.error('Error creating debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
