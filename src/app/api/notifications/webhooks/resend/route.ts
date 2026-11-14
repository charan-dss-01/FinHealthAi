import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Resend Webhook Event Handler
 * Tracks email delivery, bounce, and failure events.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    const emailId = data?.email_id;
    if (!emailId) {
      return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
    }

    let mappedStatus = 'ACCEPTED';
    let failureReason: string | undefined;

    switch (type) {
      case 'email.sent':
        mappedStatus = 'SENT';
        break;
      case 'email.delivered':
        mappedStatus = 'DELIVERED';
        break;
      case 'email.bounced':
        mappedStatus = 'FAILED';
        failureReason = data?.bounce?.message || 'Email bounced';
        break;
      case 'email.complained':
        mappedStatus = 'CANCELLED';
        failureReason = 'Spam complaint';
        break;
      default:
        mappedStatus = 'ACCEPTED';
    }

    const log = await prisma.notificationLog.findFirst({
      where: { providerId: emailId },
    });

    if (log) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: mappedStatus,
          failureReason: failureReason || log.failureReason,
        },
      });
    }

    return NextResponse.json({ success: true, updated: !!log });
  } catch (err: any) {
    console.error('[Resend Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
