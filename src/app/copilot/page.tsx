'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Paperclip,
  Image as ImageIcon,
  X,
  PlusCircle,
  CheckCircle2,
  Receipt
} from 'lucide-react';

interface ExtractedReceipt {
  merchant: string;
  amount: number;
  category: string;
  isBusiness: boolean;
  date?: string;
  description?: string;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
  imagePreview?: string;
  extractedReceipt?: ExtractedReceipt;
  addedAsTransaction?: boolean;
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
        'Namaste! I am your AI Business Assistant powered by Google Gemma 4. I help you understand your store sales, vendor payments, cash runway, and even analyze uploaded bills & receipts in everyday language. How can I help your store today?',
      timestamp: 'Just now',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('Gemma 4 31B IT');
  const [businessInfo, setBusinessInfo] = useState<any | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      setAttachedImage({ base64, mimeType, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExtractedTransaction = async (msgId: string, receipt: ExtractedReceipt) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: receipt.merchant,
          amount: receipt.amount,
          type: 'DEBIT',
          category: receipt.category,
          isBusiness: receipt.isBusiness,
          description: `Auto-extracted bill from ${receipt.merchant}`,
          transactionDate: receipt.date || new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, addedAsTransaction: true } : m))
        );
      }
    } catch (err) {
      console.error('Error saving extracted transaction:', err);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if ((!query.trim() && !attachedImage) || loading) return;

    const currentImg = attachedImage;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'USER',
      content: query || 'Attached financial document/bill for Gemma 4 analysis.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: currentImg ? `data:${currentImg.mimeType};base64,${currentImg.base64}` : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setAttachedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          image: currentImg ? { base64: currentImg.base64, mimeType: currentImg.mimeType } : undefined,
        }),
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
          extractedReceipt: data.extractedReceipt,
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
    { title: 'Read Store Database & Bills', description: 'We pull your latest sales, expenses, or scanned bill documents.' },
    { title: 'Do Grounded Business Math', description: 'Gemma 4 calculates exact profit margins, spending speed, and hiring safety.' },
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
              <Tooltip text="Ask questions about your store cash, hiring decisions, supplier spending, or upload bill photos in everyday language." />
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {businessInfo?.name || 'Ravi General Store'} • Gemma 4 Grounded Multimodal CFO
            </p>
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
              {msg.imagePreview && (
                <div className="mb-3 rounded-xl overflow-hidden border border-white/20 max-w-xs">
                  <img src={msg.imagePreview} alt="Attached bill" className="w-full h-auto object-cover" />
                </div>
              )}

              <div className="whitespace-pre-line">{msg.content}</div>

              {/* Extracted Receipt Action Card */}
              {msg.extractedReceipt && (
                <div className="mt-3 p-3.5 bg-white border border-indigo-200 rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-xs">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <span>Extracted Bill Details</span>
                    </div>
                    <Badge variant={msg.extractedReceipt.isBusiness ? 'success' : 'warning'} size="sm">
                      {msg.extractedReceipt.isBusiness ? 'Store Spend' : 'Personal Spend'}
                    </Badge>
                  </div>
                  <div className="text-slate-600 space-y-0.5 text-[11px]">
                    <div>
                      <span className="font-semibold">Merchant:</span> {msg.extractedReceipt.merchant}
                    </div>
                    <div>
                      <span className="font-semibold">Category:</span> {msg.extractedReceipt.category}
                    </div>
                    <div>
                      <span className="font-semibold">Total Amount:</span> ₹
                      {msg.extractedReceipt.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {msg.addedAsTransaction ? (
                    <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Store Ledger!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSaveExtractedTransaction(msg.id, msg.extractedReceipt!)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Save as Transaction (₹{msg.extractedReceipt.amount.toLocaleString('en-IN')})</span>
                    </button>
                  )}
                </div>
              )}

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
              <span>Gemma 4 is analyzing your store numbers and document...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Attached Image Preview */}
      {attachedImage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900">
          <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="truncate flex-1 font-semibold">Attached: {attachedImage.fileName}</span>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-1 hover:bg-indigo-100 rounded-lg text-slate-500 hover:text-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center space-x-2 bg-white border border-slate-200/80 p-2 rounded-2xl shadow-xs"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-xl transition-all"
          title="Attach Bill, Receipt or Bank Statement Screenshot for Gemma 4 Multimodal Analysis"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            attachedImage
              ? 'Ask Gemma 4 about this attached bill / document...'
              : 'Ask your AI Assistant anything about store sales, hiring, or spending...'
          }
          className="flex-1 px-3 py-2.5 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || (!inputMessage.trim() && !attachedImage)}
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
