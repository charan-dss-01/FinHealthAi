import { prisma } from '@/lib/db';
import { notificationService, calculateCustomerOutstandingBalance } from './service';

export interface SchedulerRunResult {
  inspectedEntries: number;
  dueSoonTriggered: number;
  dueTodayTriggered: number;
  overdue1Triggered: number;
  overdue2Triggered: number;
  skipped: number;
  errors: string[];
}

/**
 * Normalizes a date to YYYY-MM-DD in UTC/local day boundary for day-level difference calculation.
 */
function getDayDifference(targetDate: Date, baseDate: Date): number {
  const t = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const b = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime();
  const diffMs = t - b;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Runs the automatic payment reminder cycle.
 * Default schedule:
 *  - diff === 1: One day before due date (REMINDER_DUE_SOON)
 *  - diff === 0: On due date (REMINDER_DUE_TODAY)
 *  - diff === -1: One day after due date (REMINDER_OVERDUE_1)
 *  - diff === -4: Three days after first overdue reminder (REMINDER_OVERDUE_2)
 */
export async function runAutomaticReminderCycle(businessId?: string): Promise<SchedulerRunResult> {
  const result: SchedulerRunResult = {
    inspectedEntries: 0,
    dueSoonTriggered: 0,
    dueTodayTriggered: 0,
    overdue1Triggered: 0,
    overdue2Triggered: 0,
    skipped: 0,
    errors: [],
  };

  const now = new Date();

  // Find all pending credit entries with due dates
  const whereClause: any = {
    status: 'PENDING',
    type: 'GAVE',
    dueDate: { not: null },
    customerId: { not: null },
  };

  if (businessId) {
    whereClause.businessId = businessId;
  }

  const pendingEntries = await prisma.khaataEntry.findMany({
    where: whereClause,
    include: {
      customer: true,
      business: true,
    },
  });

  result.inspectedEntries = pendingEntries.length;

  for (const entry of pendingEntries) {
    try {
      const customer = entry.customer;
      if (!customer) {
        result.skipped++;
        continue;
      }

      // 1. Verify customer has automatic reminders enabled
      if (!customer.remindersEnabled) {
        result.skipped++;
        continue;
      }

      // 2. Verify channel consent (at least one channel must be ON)
      if (!customer.whatsappConsent && !customer.emailConsent) {
        result.skipped++;
        continue;
      }

      // 3. Calculate latest live outstanding balance for this customer
      const liveBalance = await calculateCustomerOutstandingBalance(entry.businessId, customer.id);
      if (liveBalance <= 0) {
        // Customer has paid fully - no reminders needed
        result.skipped++;
        continue;
      }

      const dueDate = new Date(entry.dueDate!);
      const dayDiff = getDayDifference(dueDate, now);

      let triggerType:
        | 'REMINDER_DUE_SOON'
        | 'REMINDER_DUE_TODAY'
        | 'REMINDER_OVERDUE_1'
        | 'REMINDER_OVERDUE_2'
        | null = null;

      if (dayDiff === 1) {
        triggerType = 'REMINDER_DUE_SOON';
      } else if (dayDiff === 0) {
        triggerType = 'REMINDER_DUE_TODAY';
      } else if (dayDiff === -1) {
        triggerType = 'REMINDER_OVERDUE_1';
      } else if (dayDiff === -4) {
        triggerType = 'REMINDER_OVERDUE_2';
      }

      if (!triggerType) {
        result.skipped++;
        continue;
      }

      // 4. Idempotency Key: Unique per customer + entry + triggerType
      // Ensures the scheduler cannot send the same reminder type twice for this entry
      const idempotencyKey = `REMIND-${entry.id}-${triggerType}`;

      // Check if already sent
      const existingLog = await prisma.notificationLog.findFirst({
        where: {
          khaataEntryId: entry.id,
          type: triggerType,
          status: { in: ['ACCEPTED', 'SENT', 'DELIVERED'] },
        },
      });

      if (existingLog) {
        result.skipped++;
        continue;
      }

      // 5. Dispatch notification
      await notificationService.dispatchNotification({
        businessId: entry.businessId,
        customerId: customer.id,
        khaataEntryId: entry.id,
        type: triggerType,
        amount: entry.amount,
        overrideOutstandingBalance: liveBalance,
        dueDate: entry.dueDate,
        description: entry.description,
        idempotencyKey,
      });

      if (triggerType === 'REMINDER_DUE_SOON') result.dueSoonTriggered++;
      if (triggerType === 'REMINDER_DUE_TODAY') result.dueTodayTriggered++;
      if (triggerType === 'REMINDER_OVERDUE_1') result.overdue1Triggered++;
      if (triggerType === 'REMINDER_OVERDUE_2') result.overdue2Triggered++;
    } catch (err: any) {
      console.error(`[ReminderScheduler] Error processing entry ${entry.id}:`, err);
      result.errors.push(`Entry ${entry.id}: ${err.message || 'Unknown error'}`);
    }
  }

  return result;
}
