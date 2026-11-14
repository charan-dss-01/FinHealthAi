import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Twilio Webhook Delivery Status Callback
 * Updates the delivery status in NotificationLog.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let messageSid = '';
    let messageStatus = '';
    let errorCode = '';
    let errorMessage = '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      messageSid = (formData.get('MessageSid') as string) || '';
      messageStatus = (formData.get('MessageStatus') as string) || '';
      errorCode = (formData.get('ErrorCode') as string) || '';
      errorMessage = (formData.get('ErrorMessage') as string) || '';
    } else {
      const body = await req.json();
      messageSid = body.MessageSid || body.messageSid || '';
      messageStatus = body.MessageStatus || body.messageStatus || '';
      errorCode = body.ErrorCode || body.errorCode || '';
      errorMessage = body.ErrorMessage || body.errorMessage || '';
    }

    if (!messageSid) {
      return NextResponse.json({ error: 'Missing MessageSid' }, { status: 400 });
    }

    // Map Twilio status to internal status
    let mappedStatus = 'ACCEPTED';
    const s = messageStatus.toLowerCase();
    if (s === 'delivered') mappedStatus = 'DELIVERED';
    else if (s === 'sent') mappedStatus = 'SENT';
    else if (s === 'failed' || s === 'undelivered') mappedStatus = 'FAILED';
    else if (s === 'canceled') mappedStatus = 'CANCELLED';

    const log = await prisma.notificationLog.findFirst({
      where: { providerId: messageSid },
    });

    if (log) {
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: mappedStatus,
          failureReason: errorCode || errorMessage ? `Twilio Code ${errorCode}: ${errorMessage}` : log.failureReason,
        },
      });
    }

    return NextResponse.json({ success: true, updated: !!log });
  } catch (err: any) {
    console.error('[Twilio Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
