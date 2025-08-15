import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete debt and all related payments (cascade)
    await prisma.debt.delete({
      where: {
        id: params.id,
        userId: user.id, // Ensure user owns this debt
      },
    })

    return NextResponse.json({ message: 'Debt deleted successfully' })
  } catch (error) {
    console.error('Error deleting debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      name, 
      totalAmount, 
      interestRate, 
      creditorName, 
      description, 
      dueDate 
    } = body

    const updatedDebt = await prisma.debt.update({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        name,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        creditorName,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json(updatedDebt)
  } catch (error) {
    console.error('Error updating debt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
