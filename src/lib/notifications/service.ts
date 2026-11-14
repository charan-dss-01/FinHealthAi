import { prisma } from '@/lib/db';
import { twilioProvider } from './twilio';
import { resendProvider } from './resend';
import {
  NotificationContext,
  NotificationLanguage,
  getWhatsAppNewCreditMessage,
  getWhatsAppPaymentReceivedMessage,
  getWhatsAppDueSoonMessage,
  getWhatsAppDueTodayMessage,
  getWhatsAppOverdueMessage,
  getEmailNewCredit,
  getEmailPaymentConfirmation,
  getEmailPaymentReminder,
} from './templates';

export type NotificationTriggerType =
  | 'CREDIT_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'REMINDER_DUE_SOON'
  | 'REMINDER_DUE_TODAY'
  | 'REMINDER_OVERDUE_1'
  | 'REMINDER_OVERDUE_2';

export interface DispatchNotificationParams {
  businessId: string;
  customerId: string;
  khaataEntryId?: string;
  type: NotificationTriggerType;
  amount?: number; // Transaction amount (credit amount or payment amount)
  overrideOutstandingBalance?: number;
  dueDate?: Date | null;
  description?: string;
  idempotencyKey?: string;
}

export interface DispatchResult {
  whatsapp?: {
    attempted: boolean;
    success: boolean;
    status: string;
    providerId?: string;
    error?: string;
  };
  email?: {
    attempted: boolean;
    success: boolean;
    status: string;
    providerId?: string;
    error?: string;
  };
}

/**
 * Calculates current outstanding balance for a customer in a business.
 * Outstanding = (Sum of GAVE pending) - (Sum of RECEIVED settled/applied)
 * Or specifically sum of all active PENDING GAVE entries.
 */
export async function calculateCustomerOutstandingBalance(
  businessId: string,
  customerId: string
): Promise<number> {
  const entries = await prisma.khaataEntry.findMany({
    where: {
      businessId,
      customerId,
    },
  });

  let balance = 0;
  for (const entry of entries) {
    if (entry.type === 'GAVE' && entry.status === 'PENDING') {
      balance += entry.amount;
    }
  }

  return Math.max(0, balance);
}

export class NotificationService {
  /**
   * Main unified dispatch method for Khaata notifications.
   * Handles preferences, consent, idempotency, template rendering, provider invocation, and logging.
   */
  async dispatchNotification(params: DispatchNotificationParams): Promise<DispatchResult> {
    const {
      businessId,
      customerId,
      khaataEntryId,
      type,
      amount,
      overrideOutstandingBalance,
      dueDate,
      description,
      idempotencyKey,
    } = params;

    const result: DispatchResult = {};

    // 1. Fetch Customer and Business
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        business: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!customer || customer.businessId !== businessId) {
      console.warn(`[NotificationService] Customer ${customerId} not found or mismatch with business ${businessId}.`);
      return result;
    }

    const business = customer.business;
    const businessName = business.name || 'Your Store';
    const businessPhone = business.owner?.phone || undefined;
    const customerLang = (customer.preferredLanguage as NotificationLanguage) || 'en';

    // 2. Compute true outstanding balance
    const outstandingBalance =
      overrideOutstandingBalance !== undefined
        ? overrideOutstandingBalance
        : await calculateCustomerOutstandingBalance(businessId, customerId);

    const formattedDueDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : undefined;

    const context: NotificationContext = {
      customerName: customer.name,
      businessName,
      amount,
      outstandingBalance,
      dueDate: formattedDueDate,
      description,
      businessPhone,
    };

    // 3. Process WhatsApp Notification if consented
    if (customer.whatsappConsent && customer.phone) {
      result.whatsapp = await this.handleWhatsAppNotification({
        businessId,
        customerId,
        khaataEntryId,
        type,
        customer,
        context,
        lang: customerLang,
        idempotencyKey: idempotencyKey ? `${idempotencyKey}-WA` : undefined,
      });
    } else {
      result.whatsapp = {
        attempted: false,
        success: false,
        status: 'SKIPPED',
        error: !customer.phone ? 'Customer has no phone number' : 'WhatsApp consent not given',
      };
    }

    // 4. Process Email Notification if consented
    if (customer.emailConsent && customer.email) {
      result.email = await this.handleEmailNotification({
        businessId,
        customerId,
        khaataEntryId,
        type,
        customer,
        context,
        idempotencyKey: idempotencyKey ? `${idempotencyKey}-EM` : undefined,
      });
    } else {
      result.email = {
        attempted: false,
        success: false,
        status: 'SKIPPED',
        error: !customer.email ? 'Customer has no email address' : 'Email consent not given',
      };
    }

    return result;
  }

  private async handleWhatsAppNotification(args: {
    businessId: string;
    customerId: string;
    khaataEntryId?: string;
    type: NotificationTriggerType;
    customer: any;
    context: NotificationContext;
    lang: NotificationLanguage;
    idempotencyKey?: string;
  }) {
    const { businessId, customerId, khaataEntryId, type, customer, context, lang, idempotencyKey } = args;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.notificationLog.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return {
          attempted: false,
          success: existing.status === 'ACCEPTED' || existing.status === 'DELIVERED',
          status: existing.status,
          providerId: existing.providerId || undefined,
          error: 'Skipped: Duplicate idempotency key',
        };
      }
    }

    // Generate message body
    let messageBody = '';
    switch (type) {
      case 'CREDIT_CREATED':
        messageBody = getWhatsAppNewCreditMessage(context, lang);
        break;
      case 'PAYMENT_RECEIVED':
        messageBody = getWhatsAppPaymentReceivedMessage(context, lang);
        break;
      case 'REMINDER_DUE_SOON':
        messageBody = getWhatsAppDueSoonMessage(context, lang);
        break;
      case 'REMINDER_DUE_TODAY':
        messageBody = getWhatsAppDueTodayMessage(context, lang);
        break;
      case 'REMINDER_OVERDUE_1':
      case 'REMINDER_OVERDUE_2':
        messageBody = getWhatsAppOverdueMessage(context, lang);
        break;
    }

    // Initial pending log
    const log = await prisma.notificationLog.create({
      data: {
        businessId,
        customerId,
        khaataEntryId,
        type,
        channel: 'WHATSAPP',
        recipient: customer.phone,
        status: 'PENDING',
        idempotencyKey,
        metadata: JSON.stringify({ amount: context.amount, outstandingBalance: context.outstandingBalance }),
      },
    });

    // Send via Twilio (supports template sid or dynamic variables)
    const sendRes = await twilioProvider.sendMessage({
      to: customer.phone,
      body: messageBody,
      contentVariables: {
        '1': context.dueDate || new Date().toLocaleDateString('en-IN'),
        '2': `₹${(context.amount || context.outstandingBalance || 0).toLocaleString('en-IN')}`,
      },
    });

    const updatedLog = await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: sendRes.status,
        providerId: sendRes.providerId || null,
        failureReason: sendRes.error || null,
      },
    });

    return {
      attempted: true,
      success: sendRes.success,
      status: updatedLog.status,
      providerId: sendRes.providerId,
      error: sendRes.error,
    };
  }

  private async handleEmailNotification(args: {
    businessId: string;
    customerId: string;
    khaataEntryId?: string;
    type: NotificationTriggerType;
    customer: any;
    context: NotificationContext;
    idempotencyKey?: string;
  }) {
    const { businessId, customerId, khaataEntryId, type, customer, context, idempotencyKey } = args;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.notificationLog.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return {
          attempted: false,
          success: existing.status === 'ACCEPTED' || existing.status === 'DELIVERED',
          status: existing.status,
          providerId: existing.providerId || undefined,
          error: 'Skipped: Duplicate idempotency key',
        };
      }
    }

    // Generate email content
    let emailData: { subject: string; html: string; text?: string };
    switch (type) {
      case 'CREDIT_CREATED':
        emailData = getEmailNewCredit(context);
        break;
      case 'PAYMENT_RECEIVED':
        emailData = getEmailPaymentConfirmation(context);
        break;
      case 'REMINDER_DUE_SOON':
      case 'REMINDER_DUE_TODAY':
        emailData = getEmailPaymentReminder(context, false);
        break;
      case 'REMINDER_OVERDUE_1':
      case 'REMINDER_OVERDUE_2':
        emailData = getEmailPaymentReminder(context, true);
        break;
    }

    // Initial pending log
    const log = await prisma.notificationLog.create({
      data: {
        businessId,
        customerId,
        khaataEntryId,
        type,
        channel: 'EMAIL',
        recipient: customer.email,
        status: 'PENDING',
        idempotencyKey,
        metadata: JSON.stringify({ subject: emailData.subject }),
      },
    });

    // Send via Resend
    const sendRes = await resendProvider.sendEmail({
      to: customer.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    const updatedLog = await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: sendRes.status,
        providerId: sendRes.providerId || null,
        failureReason: sendRes.error || null,
      },
    });

    return {
      attempted: true,
      success: sendRes.success,
      status: updatedLog.status,
      providerId: sendRes.providerId,
      error: sendRes.error,
    };
  }
}

export const notificationService = new NotificationService();
