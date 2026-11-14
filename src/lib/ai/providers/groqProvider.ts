import Groq from 'groq-sdk';
import { LLMRequestOptions, LLMResponse } from './geminiProvider';

export class GroqProvider {
  private client: Groq | null = null;
  private fastModel: string;
  private reasoningModel: string;
  private isConfigured: boolean = false;

  constructor() {
    this.fastModel = process.env.GROQ_MODEL_FAST || 'qwen/qwen3.8-27b';
    this.reasoningModel = process.env.GROQ_MODEL_REASONING || 'openai/gpt-oss-120b';
    this.initClient();
  }

  private initClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.trim().length > 10) {
      try {
        this.client = new Groq({ apiKey: apiKey.trim() });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[GroqProvider] Failed to initialize Groq client:', err);
      }
    }
  }

  private ensureClient(): boolean {
    if (!this.client) {
      this.initClient();
    }
    return Boolean(this.client && this.isConfigured);
  }

  public getStatus() {
    this.ensureClient();
    return {
      configured: this.isConfigured,
      fastModel: this.fastModel,
      reasoningModel: this.reasoningModel,
    };
  }

  private getCandidateModels(modelType?: 'FAST' | 'REASONING'): string[] {
    const primary =
      modelType === 'REASONING'
        ? process.env.GROQ_MODEL_REASONING || this.reasoningModel
        : process.env.GROQ_MODEL_FAST || this.fastModel;

    const list = [
      primary,
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
    ];

    return Array.from(new Set(list));
  }

  async generate(options: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    if (!this.ensureClient() || !this.client) {
      throw new Error('Groq Provider is not configured. Missing GROQ_API_KEY.');
    }

    const timeout = options.timeoutMs || Number(process.env.AI_REQUEST_TIMEOUT_MS) || 10000;
    const candidateModels = this.getCandidateModels(options.modelType);

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt },
    ];

    let lastErr: any = null;
    for (const m of candidateModels) {
      try {
        const completion = await this.client.chat.completions.create(
          {
            model: m,
            messages,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens ?? 1024,
          },
          { timeout }
        );

        const text = completion.choices[0]?.message?.content || '';

        return {
          text,
          provider: 'groq',
          modelUsed: m,
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        lastErr = err;
        if (err.status === 404 || err.code === 'model_not_found') {
          console.warn(`[GroqProvider] Model ${m} not found. Trying next candidate...`);
          continue;
        }
        throw err;
      }
    }

    throw lastErr || new Error('All Groq candidate models failed');
  }

  async *generateStream(options: LLMRequestOptions): AsyncGenerator<string> {
    if (!this.ensureClient() || !this.client) {
      throw new Error('Groq Provider is not configured');
    }

    const candidateModels = this.getCandidateModels(options.modelType);
    let lastErr: any = null;

    for (const m of candidateModels) {
      try {
        const stream = await this.client.chat.completions.create({
          model: m,
          messages: [
            { role: 'system', content: options.systemPrompt },
            { role: 'user', content: options.userPrompt },
          ],
          stream: true,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 1024,
        });

        let yieldedAny = false;
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            yieldedAny = true;
            yield delta;
          }
        }
        if (yieldedAny) return;
      } catch (err: any) {
        lastErr = err;
        if (err.status === 404 || err.code === 'model_not_found') {
          console.warn(`[GroqProvider Stream] Model ${m} not found. Trying next candidate...`);
          continue;
        }
        throw err;
      }
    }

    throw lastErr || new Error('All Groq streaming models failed');
  }
}

export const groqProvider = new GroqProvider();
