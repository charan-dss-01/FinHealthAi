import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { notificationService, calculateCustomerOutstandingBalance } from '@/lib/notifications/service';
import { runAutomaticReminderCycle } from '@/lib/notifications/scheduler';
import { twilioProvider } from '@/lib/notifications/twilio';
import { resendProvider } from '@/lib/notifications/resend';

describe('End-to-End Notification & Workflow Scenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Scenario 1 & 5: Customer with both WhatsApp and Email consent receives both notifications on credit entry', async () => {
    const twilioSpy = vi.spyOn(twilioProvider, 'sendMessage').mockResolvedValue({
      success: true,
      providerId: 'SM_MOCK_TWILIO_123',
      status: 'ACCEPTED',
    });

    const resendSpy = vi.spyOn(resendProvider, 'sendEmail').mockResolvedValue({
      success: true,
      providerId: 'RESEND_MOCK_456',
      status: 'ACCEPTED',
    });

    // Create test customer with both consents enabled
    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found in test db');

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'Multi Channel Customer',
        phone: '+919988776655',
        email: 'multichannel@example.com',
        whatsappConsent: true,
        emailConsent: true,
        remindersEnabled: true,
      },
    });

    const result = await notificationService.dispatchNotification({
      businessId: business.id,
      customerId: customer.id,
      type: 'CREDIT_CREATED',
      amount: 2500,
      overrideOutstandingBalance: 2500,
      dueDate: new Date(),
      description: 'Rice and Dal',
      idempotencyKey: `TEST-MULTI-${Date.now()}`,
    });

    expect(twilioSpy).toHaveBeenCalledTimes(1);
    expect(resendSpy).toHaveBeenCalledTimes(1);
    expect(result.whatsapp?.success).toBe(true);
    expect(result.whatsapp?.providerId).toBe('SM_MOCK_TWILIO_123');
    expect(result.email?.success).toBe(true);
    expect(result.email?.providerId).toBe('RESEND_MOCK_456');

    // Clean up
    await prisma.customer.delete({ where: { id: customer.id } });
  });

  it('Scenario 3: Customer without WhatsApp consent receives NO WhatsApp notification', async () => {
    const twilioSpy = vi.spyOn(twilioProvider, 'sendMessage');

    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found');

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'No WhatsApp Consent Customer',
        phone: '+919988776654',
        email: 'test@example.com',
        whatsappConsent: false, // OFF
        emailConsent: true,
      },
    });

    const result = await notificationService.dispatchNotification({
      businessId: business.id,
      customerId: customer.id,
      type: 'CREDIT_CREATED',
      amount: 1000,
      overrideOutstandingBalance: 1000,
    });

    expect(twilioSpy).not.toHaveBeenCalled();
    expect(result.whatsapp?.attempted).toBe(false);
    expect(result.whatsapp?.status).toBe('SKIPPED');

    await prisma.customer.delete({ where: { id: customer.id } });
  });

  it('Scenario 4: Customer without Email consent receives NO Email notification', async () => {
    const resendSpy = vi.spyOn(resendProvider, 'sendEmail');

    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found');

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'No Email Consent Customer',
        phone: '+919988776653',
        email: 'test@example.com',
        whatsappConsent: true,
        emailConsent: false, // OFF
      },
    });

    const result = await notificationService.dispatchNotification({
      businessId: business.id,
      customerId: customer.id,
      type: 'CREDIT_CREATED',
      amount: 1000,
      overrideOutstandingBalance: 1000,
    });

    expect(resendSpy).not.toHaveBeenCalled();
    expect(result.email?.attempted).toBe(false);
    expect(result.email?.status).toBe('SKIPPED');

    await prisma.customer.delete({ where: { id: customer.id } });
  });

  it('Scenario 7: Fully paid customers (zero outstanding balance) receive NO reminder notifications', async () => {
    const twilioSpy = vi.spyOn(twilioProvider, 'sendMessage').mockResolvedValue({
      success: true,
      providerId: 'SM_TEST_SETTLED',
      status: 'ACCEPTED',
    });

    // Create unique business for isolated scenario
    const user = await prisma.user.findFirst();
    const isolatedBusiness = await prisma.business.create({
      data: {
        ownerId: user?.id || 'isolated-owner',
        name: 'Isolated Settlement Store',
        category: 'Retail',
      },
    });

    const customer = await prisma.customer.create({
      data: {
        businessId: isolatedBusiness.id,
        name: 'Fully Paid Customer',
        phone: '+919988776652',
        whatsappConsent: true,
        remindersEnabled: true,
      },
    });

    // Create a credit entry that is SETTLED
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entry = await prisma.khaataEntry.create({
      data: {
        businessId: isolatedBusiness.id,
        customerId: customer.id,
        customerName: customer.name,
        amount: 3000,
        status: 'SETTLED', // Already paid
        dueDate: tomorrow,
        type: 'GAVE',
        description: 'Test settlement',
      },
    });

    const schedulerResult = await runAutomaticReminderCycle(isolatedBusiness.id);

    // Should not send reminders to settled entries
    expect(twilioSpy).not.toHaveBeenCalled();

    await prisma.khaataEntry.deleteMany({ where: { businessId: isolatedBusiness.id } });
    await prisma.customer.deleteMany({ where: { businessId: isolatedBusiness.id } });
    await prisma.business.delete({ where: { id: isolatedBusiness.id } });
  });

  it('Scenario 9: Idempotency prevents duplicate notifications with same key', async () => {
    vi.spyOn(twilioProvider, 'sendMessage').mockResolvedValue({
      success: true,
      providerId: 'SM_UNIQUE_ID',
      status: 'ACCEPTED',
    });

    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found');

    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: 'Idempotency Customer',
        phone: '+919988776651',
        whatsappConsent: true,
      },
    });

    const idempotencyKey = `IDEMPOTENT-TEST-${Date.now()}`;

    // First call
    const res1 = await notificationService.dispatchNotification({
      businessId: business.id,
      customerId: customer.id,
      type: 'REMINDER_DUE_TODAY',
      amount: 1500,
      overrideOutstandingBalance: 1500,
      idempotencyKey,
    });
    expect(res1.whatsapp?.attempted).toBe(true);

    // Second call with same idempotency key
    const res2 = await notificationService.dispatchNotification({
      businessId: business.id,
      customerId: customer.id,
      type: 'REMINDER_DUE_TODAY',
      amount: 1500,
      overrideOutstandingBalance: 1500,
      idempotencyKey,
    });
    expect(res2.whatsapp?.attempted).toBe(false);
    expect(res2.whatsapp?.error).toContain('Duplicate');

    await prisma.customer.delete({ where: { id: customer.id } });
  });
});
