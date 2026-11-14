/**
 * FinHealth AI — Voice CFO Types & Interfaces
 */

export type VoiceConnectionState =
  | 'IDLE'
  | 'CONNECTING'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'RECONNECTING'
  | 'ERROR';

export type VoiceProviderMode = 'GEMINI_LIVE' | 'DEGRADED_FALLBACK';

export interface VoiceSessionConfig {
  sessionId: string;
  businessId: string;
  businessName: string;
  merchantName: string;
  preferredLanguage: string;
  voiceName: string;
  mode: VoiceProviderMode;
  token?: string;
  wsUrl?: string;
}

export interface VoiceTranscriptItem {
  id: string;
  speaker: 'USER' | 'CFO' | 'SYSTEM';
  text: string;
  timestamp: string;
  isPartial?: boolean;
  toolExecuted?: {
    name: string;
    summary: string;
  };
}

export interface FinancialToolCallRequest {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface FinancialToolCallResult {
  toolCallId: string;
  name: string;
  result: Record<string, any>;
  summary: string;
}

export type ClientVoiceMessage =
  | { type: 'AUDIO_FRAME'; pcmBase64: string }
  | { type: 'INTERRUPT' }
  | { type: 'MUTE'; isMuted: boolean }
  | { type: 'TEXT_PROMPT'; text: string; language?: string }
  | { type: 'END_SESSION' };

export type ServerVoiceMessage =
  | { type: 'SESSION_INITIALIZED'; config: VoiceSessionConfig }
  | { type: 'STATE_CHANGE'; state: VoiceConnectionState }
  | { type: 'AUDIO_CHUNK'; pcmBase64: string; mimeType?: string }
  | { type: 'TRANSCRIPT'; transcript: VoiceTranscriptItem }
  | { type: 'TOOL_CALL_STARTED'; toolName: string }
  | { type: 'TOOL_CALL_COMPLETED'; toolName: string; summary: string }
  | { type: 'INTERRUPT_CONFIRMED' }
  | { type: 'ERROR'; message: string; fatal?: boolean }
  | { type: 'FALLBACK_ACTIVATED'; reason: string };
