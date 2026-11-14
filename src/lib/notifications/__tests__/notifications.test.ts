import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatToE164, twilioProvider } from '@/lib/notifications/twilio';
import { isValidEmail, resendProvider } from '@/lib/notifications/resend';
import {
  getWhatsAppNewCreditMessage,
  getWhatsAppPaymentReceivedMessage,
  getWhatsAppDueSoonMessage,
  getWhatsAppDueTodayMessage,
  getWhatsAppOverdueMessage,
  getEmailNewCredit,
  getEmailPaymentConfirmation,
  getEmailPaymentReminder,
} from '@/lib/notifications/templates';
import { notificationService } from '@/lib/notifications/service';
import { prisma } from '@/lib/db';

describe('Notification Service & Formatting Unit Tests', () => {
  describe('Phone E.164 Formatting', () => {
    it('should format 10-digit Indian numbers with +91', () => {
      expect(formatToE164('9876543210')).toBe('+919876543210');
      expect(formatToE164(' 98765 43210 ')).toBe('+919876543210');
    });

    it('should preserve already valid +91 or international E.164 numbers', () => {
      expect(formatToE164('+919876543210')).toBe('+919876543210');
      expect(formatToE164('+14155552671')).toBe('+14155552671');
    });

    it('should reject invalid or short numbers', () => {
      expect(formatToE164('12345')).toBeNull();
      expect(formatToE164('')).toBeNull();
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('customer@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@sub.domain.co.in')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Message Templates', () => {
    const mockCtx = {
      customerName: 'Suresh Gowda',
      businessName: 'Ravi Kirana Store',
      amount: 1500,
      outstandingBalance: 4500,
      dueDate: '20-Nov-2026',
      description: 'Rice Bag & Oil',
    };

    it('should render new credit WhatsApp template with correct placeholders in English', () => {
      const msg = getWhatsAppNewCreditMessage(mockCtx, 'en');
      expect(msg).toContain('Suresh Gowda');
      expect(msg).toContain('Ravi Kirana Store');
      expect(msg).toContain('₹1,500');
      expect(msg).toContain('₹4,500');
      expect(msg).toContain('20-Nov-2026');
    });

    it('should render new credit WhatsApp template in Hindi and Telugu', () => {
      const hi = getWhatsAppNewCreditMessage(mockCtx, 'hi');
      expect(hi).toContain('नमस्ते Suresh Gowda');
      expect(hi).toContain('₹1,500');

      const te = getWhatsAppNewCreditMessage(mockCtx, 'te');
      expect(te).toContain('నమస్కారం Suresh Gowda');
      expect(te).toContain('₹1,500');
    });

    it('should render payment received template', () => {
      const msg = getWhatsAppPaymentReceivedMessage(mockCtx, 'en');
      expect(msg).toContain('received and recorded your payment of ₹1,500');
      expect(msg).toContain('Remaining outstanding balance: ₹4,500');
    });

    it('should render due-date reminders', () => {
      const dueSoon = getWhatsAppDueSoonMessage(mockCtx, 'en');
      expect(dueSoon).toContain('Friendly reminder');
      expect(dueSoon).toContain('20-Nov-2026');

      const dueToday = getWhatsAppDueTodayMessage(mockCtx, 'en');
      expect(dueToday).toContain('due today');

      const overdue = getWhatsAppOverdueMessage(mockCtx, 'en');
      expect(overdue).toContain('remains outstanding');
    });

    it('should generate professional HTML emails', () => {
      const email = getEmailNewCredit(mockCtx);
      expect(email.subject).toBe('Khaata Account Updated — Ravi Kirana Store');
      expect(email.html).toContain('Suresh Gowda');
      expect(email.html).toContain('₹1,500');
      expect(email.html).toContain('₹4,500');

      const pmtEmail = getEmailPaymentConfirmation(mockCtx);
      expect(pmtEmail.subject).toBe('Payment Received — Ravi Kirana Store');
      expect(pmtEmail.html).toContain('₹1,500');

      const remEmail = getEmailPaymentReminder(mockCtx, true);
      expect(remEmail.subject).toBe('Important: Payment Overdue — Ravi Kirana Store');
    });
  });

  describe('Notification Provider Safety & Fallback', () => {
    it('Twilio provider safely returns FAILED status if credentials missing (no fake deliveries)', async () => {
      const res = await twilioProvider.sendMessage({
        to: '+919876543210',
        body: 'Test Message',
      });
      // In environment without real Twilio tokens:
      expect(res.status).toBe('FAILED');
      expect(res.error).toBeDefined();
    });

    it('Resend provider safely returns FAILED status if credentials missing', async () => {
      const res = await resendProvider.sendEmail({
        to: 'customer@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });
      expect(res.status).toBe('FAILED');
      expect(res.error).toBeDefined();
    });
  });
});
