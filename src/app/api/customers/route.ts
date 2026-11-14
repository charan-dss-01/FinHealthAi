import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
        },
        notificationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error('[Customer GET Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      phone,
      email,
      whatsappConsent,
      emailConsent,
      remindersEnabled,
      preferredLanguage,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (whatsappConsent !== undefined) updateData.whatsappConsent = Boolean(whatsappConsent);
    if (emailConsent !== undefined) updateData.emailConsent = Boolean(emailConsent);
    if (remindersEnabled !== undefined) updateData.remindersEnabled = Boolean(remindersEnabled);
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error('[Customer PATCH Error]:', err);
    return NextResponse.json({ error: 'Failed to update customer preferences' }, { status: 500 });
  }
}
