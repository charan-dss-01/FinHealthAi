import crypto from 'crypto';

export interface ActiveVoiceSession {
  sessionId: string;
  businessId: string;
  userId: string;
  expiresAt: number;
}

// Global cache for sessions across development module reloads
const globalForVoice = globalThis as unknown as {
  activeVoiceSessions?: Map<string, ActiveVoiceSession>;
};

export const activeVoiceSessions =
  globalForVoice.activeVoiceSessions ?? new Map<string, ActiveVoiceSession>();

if (process.env.NODE_ENV !== 'production') {
  globalForVoice.activeVoiceSessions = activeVoiceSessions;
}

export function createVoiceSession(businessId: string, userId: string, ttlMs: number = 30 * 60 * 1000): { token: string; sessionId: string; expiresAt: number } {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = `voice-${Date.now()}`;
  const expiresAt = Date.now() + ttlMs;

  activeVoiceSessions.set(token, {
    sessionId,
    businessId,
    userId,
    expiresAt,
  });

  return { token, sessionId, expiresAt };
}

export function getValidatedSession(token: string): ActiveVoiceSession | null {
  if (!token) return null;
  const session = activeVoiceSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeVoiceSessions.delete(token);
    return null;
  }
  return session;
}

export function invalidateVoiceSession(token: string): void {
  activeVoiceSessions.delete(token);
}
