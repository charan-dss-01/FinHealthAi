export interface LLMRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  image?: {
    mimeType: string;
    data: string; // base64
  };
  timeoutMs?: number;
  modelType?: 'FAST' | 'REASONING';
}

export interface LLMResponse {
  text: string;
  provider: 'gemini' | 'groq' | 'fallback_engine';
  modelUsed: string;
  latencyMs: number;
  firstTokenLatencyMs?: number;
}

export interface GeminiKeyStatus {
  key: string;
  isRateLimited: boolean;
  cooldownUntil: number;
}

export class GeminiProvider {
  private keys: GeminiKeyStatus[] = [];
  private currentKeyIndex: number = 0;
  private fastModel: string;
  private reasoningModel: string;

  constructor() {
    this.fastModel = process.env.GEMINI_MODEL_FAST || 'gemini-2.5-flash-lite';
    this.reasoningModel = process.env.GEMINI_MODEL_REASONING || 'gemini-2.5-flash-lite';
    this.loadKeys();
  }

  private loadKeys() {
    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMMA_API_KEY,
    ]
      .filter((k): k is string => Boolean(k && k.trim().length > 10))
      .map((k) => k.trim().replace(/['"]/g, ''));

    this.keys = Array.from(new Set(rawKeys)).map((key) => ({
      key,
      isRateLimited: false,
      cooldownUntil: 0,
    }));
  }

  private ensureKeys() {
    if (this.keys.length === 0) {
      this.loadKeys();
    }
  }

  private getActiveKey(): string | null {
    this.ensureKeys();
    if (this.keys.length === 0) return null;

    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentKeyIndex + i) % this.keys.length;
      const k = this.keys[idx];
      if (!k.isRateLimited || now > k.cooldownUntil) {
        k.isRateLimited = false;
        this.currentKeyIndex = idx;
        return k.key;
      }
    }

    return null;
  }

  private markKeyRateLimited(key: string, cooldownSeconds: number = 60) {
    const k = this.keys.find((x) => x.key === key);
    if (k) {
      k.isRateLimited = true;
      k.cooldownUntil = Date.now() + cooldownSeconds * 1000;
      console.warn(`[GeminiProvider] Key marked rate-limited for ${cooldownSeconds}s.`);
    }
  }

  private getCandidateModels(modelType?: 'FAST' | 'REASONING'): string[] {
    const configuredPrimary =
      modelType === 'REASONING'
        ? process.env.GEMINI_MODEL_REASONING || this.reasoningModel
        : process.env.GEMINI_MODEL_FAST || this.fastModel;

    const list = [
      configuredPrimary,
      'gemini-2.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-3.5-flash',
    ];

    return Array.from(new Set(list));
  }

  async generate(options: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const apiKey = this.getActiveKey();

    if (!apiKey) {
      throw new Error('No active/available Gemini API keys.');
    }

    const timeout = options.timeoutMs || Number(process.env.AI_REQUEST_TIMEOUT_MS) || 12000;

    const parts: any[] = [];
    if (options.image && options.image.data) {
      parts.push({
        inline_data: {
          mime_type: options.image.mimeType || 'image/jpeg',
          data: options.image.data,
        },
      });
    }

    const fullPrompt = `${options.systemPrompt}\n\nUSER QUESTION: "${options.userPrompt}"\n\nDIRECT ASSISTANT RESPONSE:`;
    parts.push({ text: fullPrompt });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const candidateModels = this.getCandidateModels(options.modelType);

    let lastError: any = null;

    for (const m of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'FinHealthAi/1.0.0',
            },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: options.temperature ?? 0.2,
                maxOutputTokens: options.maxTokens ?? 1024,
              },
            }),
            signal: controller.signal,
          }
        );

        if (response.status === 429) {
          this.markKeyRateLimited(apiKey, 60);
          throw new Error('Gemini Rate Limited (HTTP 429)');
        }

        if (response.status === 404) {
          continue; // Try next candidate model
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API Error (HTTP ${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        clearTimeout(timer);
        return {
          text,
          provider: 'gemini',
          modelUsed: m,
          latencyMs: Date.now() - startTime,
        };
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          clearTimeout(timer);
          throw new Error(`Gemini request timed out after ${timeout}ms`);
        }
        if (err.message && err.message.includes('429')) {
          clearTimeout(timer);
          throw err;
        }
      }
    }

    clearTimeout(timer);
    throw lastError || new Error(`Gemini models unavailable`);
  }

  /**
   * Streaming support for Gemini with resilient chunk yield
   */
  async *generateStream(options: LLMRequestOptions): AsyncGenerator<string> {
    const apiKey = this.getActiveKey();
    if (!apiKey) throw new Error('No active Gemini API key');

    const candidateModels = this.getCandidateModels(options.modelType);
    const fullPrompt = `${options.systemPrompt}\n\nUSER QUESTION: "${options.userPrompt}"\n\nDIRECT ASSISTANT RESPONSE:`;

    const parts: any[] = [];
    if (options.image && options.image.data) {
      parts.push({
        inline_data: {
          mime_type: options.image.mimeType || 'image/jpeg',
          data: options.image.data,
        },
      });
    }
    parts.push({ text: fullPrompt });

    let lastError: any = null;

    for (const m of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?key=${apiKey}&alt=sse`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'FinHealthAi/1.0.0',
            },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: options.temperature ?? 0.2,
                maxOutputTokens: options.maxTokens ?? 1024,
              },
            }),
          }
        );

        if (response.status === 429) {
          this.markKeyRateLimited(apiKey, 60);
          throw new Error('Gemini Rate Limited (HTTP 429)');
        }

        if (response.status === 404) {
          continue; // Try next model candidate
        }

        if (!response.ok || !response.body) {
          throw new Error(`Gemini Streaming Error (HTTP ${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let yieldedAny = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                const chunk = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunk) {
                  yieldedAny = true;
                  yield chunk;
                }
              } catch {}
            }
          }
        }
        if (yieldedAny) return; // Successfully completed stream
      } catch (err: any) {
        lastError = err;
        if (err.message && err.message.includes('429')) throw err;
      }
    }

    // Resilient fallback: if stream endpoint fails due to network resets, run generate and stream chunks
    try {
      const generated = await this.generate(options);
      if (generated && generated.text) {
        const words = generated.text.split(' ');
        for (let i = 0; i < words.length; i += 4) {
          yield words.slice(i, i + 4).join(' ') + ' ';
        }
        return;
      }
    } catch (genErr) {
      lastError = genErr;
    }

    throw lastError || new Error('All Gemini streaming model candidates failed.');
  }
}

export const geminiProvider = new GeminiProvider();
