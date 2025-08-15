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
    const format = searchParams.get('format') || 'csv'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const type = searchParams.get('type')

    const where: any = { userId: user.id }
    
    if (type) where.type = type
    
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    })

    if (format === 'csv') {
      // Generate CSV
      const headers = ['วันที่', 'ประเภท', 'รายละเอียด', 'หมวดหมู่', 'จำนวนเงิน']
      const csvRows = [
        headers.join(','),
        ...transactions.map(t => [
          new Date(t.date).toISOString().split('T')[0],
          t.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย',
          `"${t.description}"`,
          `"${t.category?.name || 'ไม่ระบุ'}"`,
          t.amount
        ].join(','))
      ]

      const csv = csvRows.join('\n')
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
