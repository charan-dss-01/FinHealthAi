'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { VoiceAudioEngine } from '@/lib/voice/audioEngine';
import { VoiceConnectionState, VoiceTranscriptItem } from '@/lib/voice/types';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  Database,
  Languages,
  Send,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  StopCircle,
  CheckCircle2
} from 'lucide-react';

export default function VoiceCFOPage() {
  const [state, setState] = useState<VoiceConnectionState>('IDLE');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>('en');
  const [transcripts, setTranscripts] = useState<VoiceTranscriptItem[]>([
    {
      id: 'welcome',
      speaker: 'CFO',
      text: "Namaste Ravi bhai! I am your FinHealth Voice CFO. Click 'Start Speaking' or tap the orb to ask anything about your store's Khaata receivables, cash runway, sales, or hiring decisions!",
      timestamp: 'Just now',
    },
  ]);
  const [currentPartial, setCurrentPartial] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<any | null>(null);
  const [textInput, setTextInput] = useState('');

  const audioEngineRef = useRef<VoiceAudioEngine | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const recordTimerRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((data) => {
        if (data.business) setBusinessInfo(data.business);
      })
      .catch((err) => console.error(err));
  }, []);

  // Timer when recording
  useEffect(() => {
    if (isListeningMic) {
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setRecordDuration(0);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isListeningMic]);

  // Initialize Audio Engine once
  useEffect(() => {
    const engine = new VoiceAudioEngine({
      onAudioEnergy: (level) => {
        setAudioLevel(level);
      },
      onListeningStateChange: (listening) => {
        setIsListeningMic(listening);
        if (listening) {
          setState('LISTENING');
        } else if (state === 'LISTENING') {
          setState('IDLE');
        }
      },
      onTranscriptPartial: (partial) => {
        setCurrentPartial(partial);
      },
      onTranscriptFinal: async (payload: any) => {
        const text = typeof payload === 'string' ? payload : payload?.text;
        const audioBlob = typeof payload === 'object' ? payload?.audioBlob : null;
        setCurrentPartial('');
        await processVoiceQuery({ text, audioBlob });
      },
      onInterrupted: () => {
        setState('IDLE');
        setIsListeningMic(false);
      },
      onError: (err) => {
        setErrorMessage(err.message || 'Microphone access notice');
        setIsListeningMic(false);
        setState('IDLE');
      },
    });

    audioEngineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, [language]);

  // Auto-scroll conversation transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, currentPartial, state]);

  // User click to toggle microphone / start recording
  const handleToggleMic = async () => {
    if (!audioEngineRef.current) return;
    setErrorMessage(null);

    if (isListeningMic) {
      // User tapped to finish speaking
      const { audioBlob, text } = await audioEngineRef.current.stopListening();
      setIsListeningMic(false);
      const queryText = text || currentPartial;
      setCurrentPartial('');
      await processVoiceQuery({ text: queryText, audioBlob });
    } else {
      // Start recording
      try {
        await audioEngineRef.current.startListening(language);
        setIsListeningMic(true);
        setState('LISTENING');
      } catch (err: any) {
        setErrorMessage(err?.message || 'Could not access microphone.');
      }
    }
  };

  // Submit voice or text query to backend
  const processVoiceQuery = async ({ text, audioBlob }: { text?: string; audioBlob?: Blob | null }) => {
    let audioBase64: string | undefined;

    if (audioBlob && audioBlob.size > 0) {
      try {
        const reader = new FileReader();
        audioBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.includes(',') ? res.split(',')[1] : res);
          };
          reader.readAsDataURL(audioBlob);
        });
      } catch (blobErr) {
        console.warn('FileReader error:', blobErr);
      }
    }

    const trimmedText = text?.trim() || '';

    if (!trimmedText && !audioBase64) {
      setErrorMessage('No speech detected. Please speak into your microphone and try again.');
      setState('IDLE');
      return;
    }

    setState('THINKING');
    setErrorMessage(null);
    setCurrentPartial('');
    setTextInput('');

    // Pre-insert user message if client text is available
    if (trimmedText) {
      setTranscripts((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          speaker: 'USER',
          text: trimmedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }

    try {
      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedText || undefined,
          audioBase64,
          mimeType: audioBlob?.type || 'audio/webm',
          language,
          businessId: businessInfo?.id,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate voice response');
      }

      // If text was empty on client, add server-transcribed query to transcript
      if (!trimmedText && data.query) {
        setTranscripts((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            speaker: 'USER',
            text: data.query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
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

      // Speak aloud using browser speech engine
      if (audioEngineRef.current) {
        await audioEngineRef.current.speak(data.transcript.spokenText || data.transcript.text, language);
      }

      setState('IDLE');
    } catch (err: any) {
      console.error('[VoiceCFO Page] Query error:', err);
      setErrorMessage(err.message || 'Could not process voice query. Please try again.');
      setState('IDLE');
    }
  };

  const handleInterrupt = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.interrupt();
    }
    setState('IDLE');
    setIsListeningMic(false);
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && state !== 'THINKING') {
      processVoiceQuery({ text: textInput.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col pb-16">
      <Navigation />

      {/* Main Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pt-6">
        
        {/* Top Header Card — Matching FinHealth AI Palette */}
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  FinHealth Voice CFO
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                  Live Voice Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {businessInfo?.name || 'Ravi General Store'} • Real-time Spoken Financial Advisor
              </p>
            </div>
          </div>

          {/* Quick Metrics & Language Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
              <Languages className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-slate-700 font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="en">English (India)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl items-center gap-1.5 shadow-xs flex">
              <span className="text-slate-500 font-medium">Cash Runway:</span>
              <span className="font-extrabold text-slate-900">15 Days</span>
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl items-center gap-1.5 shadow-xs flex">
              <span className="text-slate-500 font-medium">Health:</span>
              <span className="font-extrabold text-emerald-700">71/100</span>
            </div>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[11px] font-bold text-amber-700 underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Grid: Left Stage (Interactive Voice Orb) | Right Stage (Financial Intelligence Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Left Stage (Col 5) - Visualizer & Interactive Voice Orb */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between relative overflow-hidden shadow-xs min-h-[480px]">
            
            {/* Soft Ambient Radial Glow */}
            <div
              className="absolute w-72 h-72 rounded-full transition-transform duration-150 ease-out pointer-events-none opacity-30 blur-3xl"
              style={{
                background: state === 'SPEAKING'
                  ? 'radial-gradient(circle, #6366f1 0%, transparent 70%)'
                  : isListeningMic
                  ? 'radial-gradient(circle, #10b981 0%, transparent 70%)'
                  : 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
                transform: `scale(${1 + audioLevel * 2})`,
              }}
            />

            {/* Stage Status Pill */}
            <div className="z-10 flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200 text-xs font-semibold shadow-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  state === 'SPEAKING'
                    ? 'bg-indigo-600 animate-ping'
                    : isListeningMic
                    ? 'bg-emerald-500 animate-pulse'
                    : state === 'THINKING'
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-slate-700">
                {isListeningMic && `Recording (${recordDuration}s) — Listening to your voice...`}
                {!isListeningMic && state === 'THINKING' && 'Analyzing Financial Ledger...'}
                {!isListeningMic && state === 'SPEAKING' && 'Voice CFO is Speaking (Say anything to interrupt)'}
                {!isListeningMic && state === 'IDLE' && 'Tap Orb or Button to Speak'}
              </span>
            </div>

            {/* Radiant Interactive Voice Orb — Clickable to Toggle Microphone! */}
            <div className="z-10 my-6 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={state === 'THINKING'}
                className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group active:scale-95 focus:outline-none"
                style={{
                  boxShadow: state === 'SPEAKING'
                    ? `0 0 ${25 + audioLevel * 45}px rgba(99, 102, 241, 0.45)`
                    : isListeningMic
                    ? `0 0 ${25 + audioLevel * 50}px rgba(16, 185, 129, 0.5)`
                    : '0 4px 25px rgba(99, 102, 241, 0.25)',
                  background: state === 'SPEAKING'
                    ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                    : isListeningMic
                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                    : 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #8b5cf6 100%)',
                }}
                title={isListeningMic ? 'Tap to Finish Speaking' : 'Tap to Speak'}
              >
                {/* Waveform Bars or Mic Icon */}
                {isListeningMic || state === 'SPEAKING' ? (
                  <div className="flex items-center gap-1.5 h-16">
                    {[0.4, 0.8, 1.2, 0.9, 1.4, 1.0, 0.6, 1.1, 0.7, 1.3, 0.8, 0.5].map((multiplier, i) => {
                      const height = Math.max(8, (audioLevel * 60 + Math.sin(Date.now() / 200 + i) * 16) * multiplier);
                      return (
                        <div
                          key={i}
                          className="w-1.5 bg-white rounded-full transition-all duration-75 shadow-xs"
                          style={{ height: `${Math.min(52, height)}px` }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-white">
                    <Mic className="w-12 h-12 group-hover:scale-110 transition-transform drop-shadow" />
                    <span className="text-xs font-bold tracking-wide uppercase">Tap to Speak</span>
                  </div>
                )}
              </button>

              {/* Real-time speech transcript preview */}
              {currentPartial ? (
                <div className="mt-4 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800 max-w-xs text-center truncate shadow-xs font-semibold animate-pulse">
                  "{currentPartial}"
                </div>
              ) : isListeningMic ? (
                <p className="mt-3 text-xs text-emerald-600 font-semibold animate-pulse">
                  🎙️ Speak your question now... Tap Done when finished
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-400 font-medium">Click the orb or button below to speak</p>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="z-10 w-full flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
              {/* Primary Mic Button */}
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={state === 'THINKING'}
                className={`flex-1 py-3 px-5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 ${
                  isListeningMic
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                }`}
              >
                {isListeningMic ? (
                  <>
                    <StopCircle className="w-4 h-4 animate-pulse" />
                    <span>Done Speaking ({recordDuration}s) — Send</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span>Start Speaking</span>
                  </>
                )}
              </button>

              {/* Interrupt Button (When Speaking) */}
              {state === 'SPEAKING' && (
                <button
                  type="button"
                  onClick={handleInterrupt}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-transform active:scale-95 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Interrupt</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Stage (Col 7) - Live Financial Intelligence Feed */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl flex flex-col overflow-hidden shadow-xs min-h-[480px]">
            
            {/* Feed Header */}
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-sm text-slate-900">Live Dialogue & Financial Intelligence</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Grounded Store Data</span>
            </div>

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[380px]">
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
                    <div className="mb-2 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 font-semibold shadow-xs">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{t.toolExecuted.name}</span>
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      t.speaker === 'USER'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-xs font-medium'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
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
                <div className="flex items-center gap-2 text-xs text-indigo-600 p-2 animate-pulse font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Processing voice audio & executing financial tools...</span>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Suggested Spoken Prompts Pills */}
            <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Try asking:</span>
              {[
                'How much is pending in my Khaata?',
                'What is my cash runway?',
                'Can I hire a helper for ₹18,000?',
                'What is my financial health score?',
                'Explain my largest expense increases'
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => processVoiceQuery({ text: prompt })}
                  className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 whitespace-nowrap transition-colors shadow-xs active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar (Voice & Text Combined) */}
            <form onSubmit={handleSubmitText} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2.5 rounded-xl border transition-colors shadow-xs ${
                  isListeningMic
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                    : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-600 hover:text-indigo-600'
                }`}
                title={isListeningMic ? 'Finish Speaking' : 'Speak via Microphone'}
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Click Start Speaking above, tap microphone, or type here..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || state === 'THINKING'}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-transform active:scale-95"
                aria-label="Send Query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>

      </main>
    </div>
  );
}
