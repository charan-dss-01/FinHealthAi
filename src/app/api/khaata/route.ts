import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notificationService, calculateCustomerOutstandingBalance } from '@/lib/notifications/service';

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
      email,
      whatsappConsent,
      emailConsent,
      remindersEnabled,
      preferredLanguage,
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
          email: email || null,
          whatsappConsent: Boolean(whatsappConsent),
          emailConsent: Boolean(emailConsent),
          remindersEnabled: Boolean(remindersEnabled),
          preferredLanguage: preferredLanguage || 'en',
        },
      });
    } else {
      // Update phone/email or preferences if provided
      const updateFields: any = {};
      if (phone && phone !== customer.phone) updateFields.phone = phone;
      if (email && email !== customer.email) updateFields.email = email;
      if (whatsappConsent !== undefined) updateFields.whatsappConsent = Boolean(whatsappConsent);
      if (emailConsent !== undefined) updateFields.emailConsent = Boolean(emailConsent);
      if (remindersEnabled !== undefined) updateFields.remindersEnabled = Boolean(remindersEnabled);
      if (preferredLanguage) updateFields.preferredLanguage = preferredLanguage;

      if (Object.keys(updateFields).length > 0) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: updateFields,
        });
      }
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
        status: type === 'RECEIVED' ? 'SETTLED' : 'PENDING',
      },
    });

    // Automated Notification Trigger:
    // When a new credit entry is created, trigger notification to customer
    // Runs cleanly without throwing errors if provider is not configured
    let notificationResult = null;
    try {
      if (type === 'GAVE') {
        const liveBalance = await calculateCustomerOutstandingBalance(business.id, customer.id);
        notificationResult = await notificationService.dispatchNotification({
          businessId: business.id,
          customerId: customer.id,
          khaataEntryId: entry.id,
          type: 'CREDIT_CREATED',
          amount: Number(amount),
          overrideOutstandingBalance: liveBalance,
          dueDate: entry.dueDate,
          description: entry.description,
          idempotencyKey: `ENTRY-CREATE-${entry.id}`,
        });
      } else if (type === 'RECEIVED') {
        const liveBalance = await calculateCustomerOutstandingBalance(business.id, customer.id);
        notificationResult = await notificationService.dispatchNotification({
          businessId: business.id,
          customerId: customer.id,
          khaataEntryId: entry.id,
          type: 'PAYMENT_RECEIVED',
          amount: Number(amount),
          overrideOutstandingBalance: liveBalance,
          description: entry.description,
          idempotencyKey: `ENTRY-PAYMENT-${entry.id}`,
        });
      }
    } catch (notifErr) {
      console.error('[Khaata Notification Trigger Error]:', notifErr);
    }

    return NextResponse.json({ success: true, entry, notifications: notificationResult });
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
      include: {
        customer: true,
        business: true,
      },
    });

    // If marked as SETTLED (payment collected for this credit entry), trigger Payment Confirmation notification
    let notificationResult = null;
    if (status === 'SETTLED' && updated.customerId) {
      try {
        const liveBalance = await calculateCustomerOutstandingBalance(updated.businessId, updated.customerId);
        notificationResult = await notificationService.dispatchNotification({
          businessId: updated.businessId,
          customerId: updated.customerId,
          khaataEntryId: updated.id,
          type: 'PAYMENT_RECEIVED',
          amount: updated.amount,
          overrideOutstandingBalance: liveBalance,
          description: updated.description,
          idempotencyKey: `ENTRY-SETTLED-${updated.id}`,
        });
      } catch (notifErr) {
        console.error('[Khaata Settle Notification Error]:', notifErr);
      }
    }

    return NextResponse.json({ success: true, entry: updated, notifications: notificationResult });
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
