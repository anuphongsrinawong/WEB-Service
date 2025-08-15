import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify debt ownership
    const debt = await prisma.debt.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    }

    const payments = await prisma.debtPayment.findMany({
      where: {
        debtId: params.id,
        userId: user.id,
      },
      orderBy: { paymentDate: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching debt payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify debt ownership
    const debt = await prisma.debt.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, paymentDate, description } = body

    // Create payment record
    const payment = await prisma.debtPayment.create({
      data: {
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        description: description || null,
        debtId: params.id,
        userId: user.id,
      },
    })

    // Update debt remaining amount
    const totalPaid = await prisma.debtPayment.aggregate({
      where: {
        debtId: params.id,
        userId: user.id,
      },
      _sum: {
        amount: true,
      },
    })

    const newRemainingAmount = Math.max(0, debt.totalAmount - (totalPaid._sum.amount || 0))
    const newStatus = newRemainingAmount <= 0 ? 'PAID_OFF' : debt.status

    await prisma.debt.update({
      where: { id: params.id },
      data: {
        remainingAmount: newRemainingAmount,
        status: newStatus,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating debt payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
