import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createVoiceSession,
  getValidatedSession,
  invalidateVoiceSession,
} from '../sessionStore';
import {
  VOICE_FINANCIAL_TOOL_DECLARATIONS,
  executeVoiceFinancialTool,
} from '../tools';
import { prisma } from '@/lib/db';

describe('FinHealth AI — Voice CFO Architecture & Tools', () => {
  let mockBusinessId: string;

  beforeEach(async () => {
    // Resolve an existing business in DB
    const b = await prisma.business.findFirst({
      select: { id: true, name: true },
    });
    mockBusinessId = b ? b.id : 'test-business-id';
  });

  describe('1. Voice Session Store & Security', () => {
    it('creates a valid 30-minute voice session token', () => {
      const { token, sessionId, expiresAt } = createVoiceSession(mockBusinessId, 'user-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(16);
      expect(sessionId).toContain('voice-');
      expect(expiresAt).toBeGreaterThan(Date.now());
    });

    it('validates an active session token correctly', () => {
      const { token } = createVoiceSession(mockBusinessId, 'user-456');
      const session = getValidatedSession(token);

      expect(session).not.toBeNull();
      expect(session?.businessId).toBe(mockBusinessId);
      expect(session?.userId).toBe('user-456');
    });

    it('returns null for an invalid or non-existent token', () => {
      const session = getValidatedSession('completely-fake-token');
      expect(session).toBeNull();
    });

    it('invalidates a session immediately when requested', () => {
      const { token } = createVoiceSession(mockBusinessId, 'user-789');
      invalidateVoiceSession(token);
      const session = getValidatedSession(token);
      expect(session).toBeNull();
    });
  });

  describe('2. Voice Tool Declarations Schema', () => {
    it('provides all 8 required financial tools for Gemini Live', () => {
      const toolNames = VOICE_FINANCIAL_TOOL_DECLARATIONS.map((t) => t.name);

      expect(toolNames).toContain('get_business_summary');
      expect(toolNames).toContain('get_revenue_and_expenses');
      expect(toolNames).toContain('get_cash_runway');
      expect(toolNames).toContain('get_financial_health_score');
      expect(toolNames).toContain('get_customer_khaata_balances');
      expect(toolNames).toContain('get_overdue_payments');
      expect(toolNames).toContain('explain_expense_increases');
      expect(toolNames).toContain('run_what_if_simulation');
      expect(VOICE_FINANCIAL_TOOL_DECLARATIONS.length).toBe(8);
    });

    it('formats tool declarations matching Gemini FunctionDeclaration schema', () => {
      for (const tool of VOICE_FINANCIAL_TOOL_DECLARATIONS) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('OBJECT');
      }
    });
  });

  describe('3. Voice Financial Tool Execution & Indian MSME Persona', () => {
    it('executes get_business_summary and returns conversational summary', async () => {
      const res = await executeVoiceFinancialTool(mockBusinessId, 'get_business_summary');

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('get_business_summary');
      expect(res.voiceSummary).toContain('balance');
      expect(res.data).toBeDefined();
      expect(res.data.bankBalance).toBeDefined();
    });

    it('executes get_cash_runway and reports exact buffer days', async () => {
      const res = await executeVoiceFinancialTool(mockBusinessId, 'get_cash_runway');

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('get_cash_runway');
      expect(res.data.cashRunwayDays).toBeDefined();
      expect(res.voiceSummary).toContain('runway');
    });

    it('executes get_customer_khaata_balances with Indian currency formatting', async () => {
      const res = await executeVoiceFinancialTool(mockBusinessId, 'get_customer_khaata_balances');

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('get_customer_khaata_balances');
      expect(res.data.totalOutstanding).toBeDefined();
      expect(res.voiceSummary).toContain('₹');
    });

    it('executes get_financial_health_score and returns score out of 100', async () => {
      const res = await executeVoiceFinancialTool(mockBusinessId, 'get_financial_health_score');

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('get_financial_health_score');
      expect(res.data.healthScore).toBeGreaterThanOrEqual(0);
      expect(res.data.healthScore).toBeLessThanOrEqual(100);
      expect(res.voiceSummary).toContain('/100');
    });

    it('executes run_what_if_simulation for hiring staff helper', async () => {
      const res = await executeVoiceFinancialTool(mockBusinessId, 'run_what_if_simulation', {
        newMonthlyStaffCost: 18000,
      });

      expect(res.success).toBe(true);
      expect(res.toolName).toBe('run_what_if_simulation');
      expect(res.data.simulated).toBeDefined();
      expect(res.data.deltas).toBeDefined();
      expect(res.voiceSummary).toContain('18,000');
    });

    it('gracefully handles unsupported tool names', async () => {
      const res = await executeVoiceFinancialTool(mockBusinessId, 'unsupported_tool');

      expect(res.success).toBe(false);
      expect(res.voiceSummary).toContain('not support');
    });
  });
});
