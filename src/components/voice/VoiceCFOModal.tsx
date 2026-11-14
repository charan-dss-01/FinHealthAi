'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  PhoneOff,
  AlertCircle,
  Database,
  Languages,
} from 'lucide-react';
import { VoiceAudioEngine } from '@/lib/voice/audioEngine';
import { VoiceConnectionState, VoiceTranscriptItem } from '@/lib/voice/types';
import { MarkdownContent } from '@/components/ui/MarkdownContent';

interface VoiceCFOModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
}

export function VoiceCFOModal({ isOpen, onClose, businessId }: VoiceCFOModalProps) {
  const [state, setState] = useState<VoiceConnectionState>('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>('en');
  const [transcripts, setTranscripts] = useState<VoiceTranscriptItem[]>([]);
  const [currentPartial, setCurrentPartial] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [toolExecuting, setToolExecuting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioEngineRef = useRef<VoiceAudioEngine | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const currentQueryRef = useRef<string>('');

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentPartial]);

  // Start voice session when modal opens
  useEffect(() => {
    if (isOpen) {
      initSession();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const cleanup = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
      audioEngineRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState('IDLE');
    setAudioLevel(0);
    setCurrentPartial('');
    setToolExecuting(null);
  };

  const initSession = async () => {
    try {
      setState('CONNECTING');
      setErrorMessage(null);

      // Step 1: Request authorized voice session from backend
      const res = await fetch('/api/voice/session', { credentials: 'include', method: 'POST' });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to authenticate voice session');
      }

      // Step 2: Initialize Web Audio Engine
      const engine = new VoiceAudioEngine({
        onAudioEnergy: (level) => {
          setAudioLevel(level);
        },
        onTranscriptPartial: (partial) => {
          setCurrentPartial(partial);
          currentQueryRef.current = partial;
        },
        onTranscriptFinal: async (payload: any) => {
          const text = typeof payload === 'string' ? payload : payload?.text;
          if (!text || !text.trim()) return;
          setCurrentPartial('');
          await handleUserVoiceQuery(text.trim());
        },
        onInterrupted: () => {
          setState('LISTENING');
          // If WS connected, signal interruption
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'INTERRUPT' }));
          }
        },
        onError: (err) => {
          setErrorMessage(err.message || 'Microphone error');
        },
      });

      await engine.startMicrophone(language);
      audioEngineRef.current = engine;

      // Add welcoming introductory transcript
      setTranscripts([
        {
          id: 'intro',
          speaker: 'CFO',
          text: `Namaste ${data.merchantName || 'Merchant'}! I am your FinHealth Voice CFO. Ask me anything about your Khaata, sales, expenses, cash runway, or hiring plans!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Speak welcome greeting
      engine.speak(`Namaste! I am your FinHealth Voice CFO. How can I help your business today?`, language);

      // Step 3: Try WebSocket connection
      try {
        const wsUrl = `ws://${window.location.hostname || 'localhost'}:${data.wsPort || 3001}${data.wsPath}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[VoiceCFO] WebSocket connected successfully.');
        };

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'TRANSCRIPT') {
              setTranscripts((prev) => [...prev, msg.transcript]);
              if (msg.transcript.speaker === 'CFO') {
                setState('SPEAKING');
                await engine.speak(msg.transcript.spokenText || msg.transcript.text, language);
                setState('LISTENING');
              }
            } else if (msg.type === 'TOOL_CALL_STARTED') {
              setToolExecuting(msg.toolName);
            } else if (msg.type === 'TOOL_CALL_COMPLETED') {
              setToolExecuting(null);
            } else if (msg.type === 'STATE_CHANGE') {
              setState(msg.state);
            }
          } catch {}
        };

        ws.onerror = () => {
          console.log('[VoiceCFO] WS fallback active.');
        };

        wsRef.current = ws;
      } catch (wsErr) {
        console.log('[VoiceCFO] Using direct HTTP fallback pipeline.');
      }

      setState('LISTENING');
    } catch (err: any) {
      console.error('[VoiceCFO] Initialization error:', err);
      setErrorMessage(err.message || 'Failed to start voice CFO session');
      setState('ERROR');
    }
  };

  const handleUserVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Add user question to transcript
    const userMsg: VoiceTranscriptItem = {
      id: `user-${Date.now()}`,
      speaker: 'USER',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTranscripts((prev) => [...prev, userMsg]);
    setState('THINKING');

    // If WebSocket is alive, send via WS
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'TEXT_PROMPT',
          text: queryText,
          language,
        })
      );
      return;
    }

    // Degraded Resilient Fallback via /api/voice/interact
    try {
      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          language,
          businessId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate voice response');
      }

      const cfoTranscript: VoiceTranscriptItem = {
        id: data.transcript.id,
        speaker: 'CFO',
        text: data.transcript.text,
        timestamp: data.transcript.timestamp,
        toolExecuted: data.toolExecuted,
      };

      setTranscripts((prev) => [...prev, cfoTranscript]);
      setState('SPEAKING');

      // Speak response using speech engine
      if (audioEngineRef.current) {
        await audioEngineRef.current.speak(data.transcript.spokenText || data.transcript.text, language);
      }

      setState('LISTENING');
    } catch (err: any) {
      console.error('[VoiceCFO] Interact error:', err);
      setErrorMessage('Could not process voice query. Please try again.');
      setState('LISTENING');
    }
  };

  const handleInterrupt = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.interrupt();
    }
    setState('LISTENING');
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioEngineRef.current) {
      audioEngineRef.current.setMuted(nextMuted);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleUserVoiceQuery(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-indigo-100 dark:border-slate-800 flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight">FinHealth Voice CFO</h3>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-medium">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 hidden sm:block">Real-time Indian MSME Financial Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Picker */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs rounded-xl px-2 py-1 border border-white/20 focus:outline-none cursor-pointer"
              >
                <option value="en" className="text-slate-800">English</option>
                <option value="hi" className="text-slate-800">हिन्दी (Hindi)</option>
                <option value="te" className="text-slate-800">తెలుగు (Telugu)</option>
              </select>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Dynamic Compact Visualizer Stage */}
        <div className="relative h-28 bg-slate-950 flex flex-col items-center justify-center px-4 overflow-hidden shrink-0">
          {/* Pulsing Radial Background Glow */}
          <div
            className="absolute w-44 h-44 rounded-full transition-transform duration-100 ease-out pointer-events-none"
            style={{
              background: state === 'SPEAKING'
                ? 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 70%)'
                : state === 'LISTENING'
                ? 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0) 70%)'
                : 'radial-gradient(circle, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0) 70%)',
              transform: `scale(${1 + audioLevel * 1.5})`,
            }}
          />

          {/* Animated Waveform Bars */}
          <div className="flex items-center justify-center gap-1.5 h-10 z-10">
            {[0.4, 0.7, 1.0, 0.8, 1.2, 0.9, 0.5, 1.1, 0.6, 0.8, 1.0, 0.5].map((multiplier, i) => {
              const height = state === 'SPEAKING' || state === 'LISTENING'
                ? Math.max(6, (audioLevel * 45 + Math.sin(Date.now() / 200 + i) * 12) * multiplier)
                : 5;

              return (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    state === 'SPEAKING'
                      ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                      : state === 'LISTENING'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-400/60'
                  }`}
                  style={{ height: `${Math.min(36, height)}px` }}
                />
              );
            })}
          </div>

          {/* Status Badge */}
          <div className="mt-2 z-10 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                state === 'SPEAKING'
                  ? 'bg-indigo-400'
                  : state === 'LISTENING'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-300">
              {state === 'SPEAKING' && 'CFO is Speaking... (Say anything to interrupt)'}
              {state === 'LISTENING' && (isMuted ? 'Microphone Muted' : 'Listening to your voice...')}
              {state === 'THINKING' && 'Analyzing store financial data...'}
              {state === 'CONNECTING' && 'Connecting audio...'}
              {state === 'ERROR' && 'Connection issue'}
            </span>
          </div>

          {/* Real-time partial transcript preview */}
          {currentPartial && (
            <div className="absolute bottom-1 px-3 py-0.5 bg-black/60 backdrop-blur rounded-full text-[11px] text-indigo-300 z-10 max-w-[85%] truncate">
              "{currentPartial}"
            </div>
          )}
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-slate-900/50 min-h-[180px] max-h-[320px]">
          {transcripts.map((t) => (
            <div
              key={t.id}
              className={`flex flex-col ${t.speaker === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                  {t.speaker === 'USER' ? 'YOU' : 'VOICE CFO'}
                </span>
                <span className="text-[10px] text-slate-400">{t.timestamp}</span>
              </div>

              {/* Tool Execution Tag */}
              {t.toolExecuted && (
                <div className="mb-1.5 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold">{t.toolExecuted.name}</span>
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  t.speaker === 'USER'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/80 dark:border-slate-700 shadow-sm'
                }`}
              >
                {t.speaker === 'USER' ? (
                  <div className="whitespace-pre-line">{t.text}</div>
                ) : (
                  <MarkdownContent content={t.text} />
                )}
              </div>
            </div>
          ))}

          {state === 'THINKING' && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Checking bank ledger & running financial tools...</span>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Quick Suggested Spoken Prompts */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Try asking:</span>
          {[
            'How much is pending in my Khaata?',
            'What is my cash runway?',
            'Can I hire a helper for ₹18,000?',
            'What is my financial health score?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs transition-colors border ${
              isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Unmute' : 'Mute Mic'}</span>
          </button>

          {/* Interrupt Button */}
          {state === 'SPEAKING' && (
            <button
              onClick={handleInterrupt}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-transform active:scale-95 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Interrupt CFO</span>
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-transform active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Call</span>
          </button>
        </div>

      </div>
    </div>
  );
}
