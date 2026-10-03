'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Send, Bot, User, RefreshCw, HelpCircle, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
}

function CopilotChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { language, t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ASSISTANT',
      content:
        'Namaste! I am your AI Business Assistant. I help you understand your store sales, money spent, and cash duration in simple everyday language. How can I help your business today?',
      timestamp: 'Just now',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('Gemma 4 31B IT');
  const [businessInfo, setBusinessInfo] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  const suggestedPrompts = [
    '💡 Can I afford to hire a new staff helper at ₹18,000/month?',
    '🚨 How can I extend how long my money lasts beyond 30 days?',
    '🛒 Which expenses are personal spending leaking from my store account?',
    '📈 Are my store sales improving compared to money spent?',
  ];

  useEffect(() => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((d) => {
        if (d.business) setBusinessInfo(d.business);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'USER',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, language }),
      });

      const data = await res.json();
      if (data?.modelUsed) {
        setActiveModel(data.modelUsed);
      }
      if (data?.reply) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ASSISTANT',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else if (data?.error) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ASSISTANT',
          content: `⚠️ Note: ${data.error}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('[Copilot] Fetch Error:', err);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ASSISTANT',
        content: 'Unable to reach the assistant server. Please verify your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && !autoSentRef.current) {
      autoSentRef.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  const metric = businessInfo?.metrics?.[0] || { healthScore: 78, cashRunwayDays: 28, healthState: 'GREEN' };

  const assistantSteps = [
    { title: 'Read Store Database', description: 'We pull your latest sales, expenses, and available bank balance.' },
    { title: 'Do Simple Business Math', description: 'We calculate exact profit margins, spending speed, and hiring safety.' },
    { title: 'Explain in Simple Language', description: 'We give you clear, actionable advice suited for an Indian Kirana/SMB owner.' },
  ];

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-4 pt-6">
      {/* Metric Banner Header Card */}
      <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-600/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{t('nav.chat', 'Ask AI Assistant')}</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <Tooltip text="Ask questions about your store cash, hiring decisions, or supplier spending in everyday language." />
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">{businessInfo?.name || 'Ravi General Store'} • Grounded Business Math</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-bold flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Model: {activeModel}</span>
          </div>
          <div className="hidden sm:flex px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl items-center gap-2">
            <span className="text-slate-500 font-medium">{t('dash.health_title', 'Business Health')}:</span>
            <span className="font-extrabold text-slate-900">{metric.healthScore}/100</span>
          </div>
          <div className="hidden sm:flex px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl items-center gap-2">
            <span className="text-amber-800 font-medium">{t('dash.money_duration', 'Money Duration')}:</span>
            <span className="font-extrabold text-amber-900">~{metric.cashRunwayDays} Days</span>
          </div>
        </div>
      </div>

      {/* How AI Assistant Works Accordion */}
      <HowItWorksModal title="AI Assistant" steps={assistantSteps} />

      {/* Suggested Prompts Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Click Any Suggested Question:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((promptText, i) => (
            <button
              key={i}
              onClick={() => sendMessage(promptText)}
              className="text-xs bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 px-3.5 py-2 rounded-xl transition-all text-left shadow-xs active:scale-95"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream Card */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xs min-h-[440px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.sender === 'USER' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold ${
                msg.sender === 'USER' ? 'bg-indigo-600 shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {msg.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-600" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'USER'
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>
              <div
                suppressHydrationWarning
                className={`text-[10px] mt-2 ${msg.sender === 'USER' ? 'text-indigo-200' : 'text-slate-400'} text-right`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>AI Assistant analyzing your store numbers...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center space-x-2 bg-white border border-slate-200/80 p-2 rounded-2xl shadow-xs"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask your AI Assistant anything about store sales, hiring, or spending..."
          className="flex-1 px-4 py-2.5 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95"
          aria-label="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </main>
  );
}

export default function CopilotPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col pb-16">
      <Navigation />
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Assistant...</div>}>
        <CopilotChatContent />
      </Suspense>
    </div>
  );
}
