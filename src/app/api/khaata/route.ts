import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status'); // 'ALL' | 'PENDING' | 'SETTLED'
    const search = searchParams.get('search') || '';

    let business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId } })
      : await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    const whereClause: any = {
      businessId: business.id,
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { customerName: { contains: search } },
        { description: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const entries = await prisma.khaataEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const customers = await prisma.customer.findMany({
      where: { businessId: business.id },
      orderBy: { name: 'asc' },
    });

    // Summary calculations from real database entries
    const allEntries = await prisma.khaataEntry.findMany({
      where: { businessId: business.id },
    });

    const totalReceivables = allEntries
      .filter((e) => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingCount = allEntries.filter((e) => e.status === 'PENDING').length;
    const settledCount = allEntries.filter((e) => e.status === 'SETTLED').length;

    const now = new Date();
    const overdueEntries = allEntries.filter(
      (e) => e.status === 'PENDING' && e.dueDate && new Date(e.dueDate) < now
    );
    const overdueAmount = overdueEntries.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      success: true,
      entries,
      customers,
      summary: {
        totalReceivables,
        pendingCount,
        settledCount,
        overdueCount: overdueEntries.length,
        overdueAmount,
      },
    });
  } catch (error) {
    console.error('Khaata GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch Khaata records' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      phone,
      amount,
      description,
      dueDate,
      type = 'GAVE',
      businessId,
    } = body;

    if (!customerName || !amount) {
      return NextResponse.json(
        { error: 'Customer name and amount are required.' },
        { status: 400 }
      );
    }

    let business = businessId
      ? await prisma.business.findUnique({ where: { id: businessId } })
      : await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        businessId: business.id,
        name: { equals: customerName },
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId: business.id,
          name: customerName,
          phone: phone || null,
        },
      });
    }

    const entry = await prisma.khaataEntry.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        customerName,
        phone: phone || null,
        amount: Number(amount),
        type,
        description: description || 'Store credit/purchase',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Khaata POST Error:', error);
    return NextResponse.json({ error: 'Failed to create Khaata entry' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, amount, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.khaataEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    console.error('Khaata PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update Khaata entry' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required.' }, { status: 400 });
    }

    await prisma.khaataEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Khaata DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete Khaata entry' }, { status: 500 });
  }
}
