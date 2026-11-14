import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyFinancialTask } from '@/lib/ai/taskClassifier';
import { aiResponseCache } from '@/lib/ai/cache';
import { geminiProvider } from '@/lib/ai/providers/geminiProvider';
import { groqProvider } from '@/lib/ai/providers/groqProvider';
import { llmOrchestrator } from '@/lib/ai/orchestrator';

describe('AI Copilot Architecture & Routing Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Lightweight Task Classifier (<1ms)', () => {
    it('classifies affordability & hiring queries as WHAT_IF_SIMULATION with REASONING model', () => {
      const task = classifyFinancialTask('Can I afford to hire a new staff helper at 18000/month?');
      expect(task.category).toBe('WHAT_IF_SIMULATION');
      expect(task.recommendedModelType).toBe('REASONING');
      expect(task.requiresHistoricalComparison).toBe(true);
    });

    it('classifies Telugu hiring query accurately', () => {
      const task = classifyFinancialTask('కొత్త సిబ్బంది జీతం ఇవ్వగలనా?');
      expect(task.category).toBe('WHAT_IF_SIMULATION');
    });

    it('classifies expense leak queries as EXPENSE_ANALYSIS', () => {
      const task = classifyFinancialTask('Which expenses are personal spending leaking from store account?');
      expect(task.category).toBe('EXPENSE_ANALYSIS');
      expect(task.requiresTransactionDrilldown).toBe(true);
    });

    it('classifies image attachment as TRANSACTION_ANALYSIS', () => {
      const task = classifyFinancialTask('', true);
      expect(task.category).toBe('TRANSACTION_ANALYSIS');
      expect(task.requiresTransactionDrilldown).toBe(true);
    });
  });

  describe('Smart Response Caching', () => {
    it('caches and retrieves identical normalized questions', () => {
      aiResponseCache.set('biz-123', 'How is my business doing?', 'en', 'Your business is healthy.', 'gemini-2.5-flash', 'gemini');

      // Test case-insensitive and punctuation-insensitive cache hit
      const hit = aiResponseCache.get('biz-123', 'how is my business doing', 'en');
      expect(hit).not.toBeNull();
      expect(hit?.response).toBe('Your business is healthy.');
      expect(hit?.provider).toBe('gemini');
    });

    it('isolates cache per merchant/business', () => {
      aiResponseCache.set('biz-1', 'sales summary', 'en', 'Biz 1 Sales', 'gemini-2.5-flash', 'gemini');
      const miss = aiResponseCache.get('biz-2', 'sales summary', 'en');
      expect(miss).toBeNull();
    });
  });

  describe('Provider Failover (Gemini -> Groq)', () => {
    it('successfully falls back to Groq when Gemini returns 429 rate limit', async () => {
      vi.spyOn(geminiProvider, 'generate').mockRejectedValue(new Error('Gemini Rate Limited (HTTP 429)'));
      vi.spyOn(groqProvider, 'generate').mockResolvedValue({
        text: '1. Sales are steady at ₹4,82,000.\n2. Expenses are within limits.\n3. Keep operating buffer.',
        provider: 'groq',
        modelUsed: 'llama-3.1-8b-instant',
        latencyMs: 120,
      });

      const res = await llmOrchestrator.execute({
        businessId: 'test-biz',
        systemPrompt: 'System',
        userPrompt: 'Tell me my business health',
        language: 'en',
        enableCache: false,
      });

      expect(res.fallbackTriggered).toBe(true);
      expect(res.provider).toBe('groq');
      expect(res.reply).toContain('Sales are steady');
    });

    it('uses primary Gemini when healthy', async () => {
      vi.spyOn(geminiProvider, 'generate').mockResolvedValue({
        text: '1. Primary Gemini response.',
        provider: 'gemini',
        modelUsed: 'gemini-2.5-flash',
        latencyMs: 350,
      });

      const res = await llmOrchestrator.execute({
        businessId: 'test-biz',
        systemPrompt: 'System',
        userPrompt: 'Tell me my sales',
        language: 'en',
        enableCache: false,
      });

      expect(res.fallbackTriggered).toBe(false);
      expect(res.provider).toBe('gemini');
      expect(res.reply).toBe('1. Primary Gemini response.');
    });
  });
});
