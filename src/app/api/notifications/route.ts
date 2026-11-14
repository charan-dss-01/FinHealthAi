import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runAutomaticReminderCycle } from '@/lib/notifications/scheduler';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const businessIdParam = searchParams.get('businessId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Merchant ownership identification
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('finhealth_session')?.value;
    let businessId = businessIdParam;

    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        if (session.businessId) businessId = session.businessId;
        else if (session.userId) {
          const b = await prisma.business.findFirst({ where: { ownerId: session.userId } });
          if (b) businessId = b.id;
        }
      } catch {}
    }

    if (!businessId) {
      const firstB = await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });
      if (firstB) businessId = firstB.id;
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const whereClause: any = { businessId };
    if (customerId) whereClause.customerId = customerId;

    const logs = await prisma.notificationLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        khaataEntry: { select: { id: true, amount: true, description: true, dueDate: true } },
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    console.error('[Notification History GET Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch notification logs' }, { status: 500 });
  }
}

/**
 * Trigger background reminder cycle on demand or via cron scheduler
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cronSecret = req.headers.get('x-cron-secret') || searchParams.get('secret');

    // If cron secret is set in env, enforce it
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessId = body.businessId;

    const result = await runAutomaticReminderCycle(businessId);

    return NextResponse.json({
      success: true,
      message: 'Automatic reminder cycle completed successfully.',
      result,
    });
  } catch (err: any) {
    console.error('[Notification Trigger Error]:', err);
    return NextResponse.json({ error: 'Reminder cycle execution failed' }, { status: 500 });
  }
}
