'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { MarkdownContent } from '@/components/ui/MarkdownContent';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  Paperclip,
  Image as ImageIcon,
  X,
  PlusCircle,
  CheckCircle2,
  Receipt,
  Copy,
  Check,
  StopCircle,
  RotateCcw,
  Zap,
  ShieldCheck,
  Mic
} from 'lucide-react';
import { VoiceCFOModal } from '@/components/voice/VoiceCFOModal';

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
  provider?: string;
  modelUsed?: string;
  latencyMs?: number;
  cached?: boolean;
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
        'Namaste! I am your AI Financial Copilot for FinHealth AI. I provide fast, grounded intelligence on your store sales, cash runway, vendor spending, and bill receipts in everyday language.',
      timestamp: 'Just now',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState('Gemini 2.5 Flash');
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'groq'>('gemini');
  const [businessInfo, setBusinessInfo] = useState<any | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mimeType: string; fileName: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
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
    if (searchParams.get('voice') === 'true') {
      setIsVoiceModalOpen(true);
    }
  }, [searchParams]);

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
  }, [messages, loading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setStreamingMessageId(null);
    }
  };

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
      content: query || 'Attached financial document/bill for AI Copilot analysis.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: currentImg ? `data:${currentImg.mimeType};base64,${currentImg.base64}` : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setAttachedImage(null);
    setLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Check if streaming should be used (text questions)
    const isImage = Boolean(currentImg);

    try {
      if (!isImage) {
        // Stream text queries for sub-second first-token UX
        const assistantMsgId = (Date.now() + 1).toString();
        setStreamingMessageId(assistantMsgId);

        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            sender: 'ASSISTANT',
            content: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            language,
            stream: true,
          }),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error('Stream request failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });
          const lines = textChunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const payload = line.substring(6).trim();
              if (payload === '[DONE]') break;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.chunk) {
                  accumulated += parsed.chunk;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
                  );
                }
              } catch {}
            }
          }
        }

        // If stream ended with no accumulated tokens, retrieve via standard JSON endpoint
        if (!accumulated.trim()) {
          const fallbackRes = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: query,
              language,
              stream: false,
            }),
            signal: abortController.signal,
          });
          const fbData = await fallbackRes.json();
          if (fbData?.reply) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fbData.reply } : m))
            );
          }
        }
      } else {
        // Non-streamed for multimodal document analysis
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            language,
            image: currentImg ? { base64: currentImg.base64, mimeType: currentImg.mimeType } : undefined,
          }),
          signal: abortController.signal,
        });

        const data = await res.json();
        if (data?.modelUsed) setActiveModel(data.modelUsed);
        if (data?.provider) setActiveProvider(data.provider);

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ASSISTANT',
          content: data.reply || 'Analysis complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          extractedReceipt: data.extractedReceipt,
          modelUsed: data.modelUsed,
          provider: data.provider,
          latencyMs: data.latencyMs,
          cached: data.cached,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
      } else {
        console.error('[Copilot] Fetch Error:', err);
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ASSISTANT',
          content: 'Unable to reach the assistant server. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } finally {
      setLoading(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
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
    { title: 'Read Store Database & Bills', description: 'Grounded financial figures queried deterministically from your store ledger.' },
    { title: 'Verified Store Ledger', description: 'Financial insights calculated directly from your store cash and billing records.' },
    { title: 'Explain in Simple Language', description: 'Clear, actionable 3-step advice in English, Telugu, Hindi, and Indian dialects.' },
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
              {businessInfo?.name || 'Ravi General Store'} • Financial Intelligence Assistant
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/voice"
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all transform active:scale-95"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Voice CFO</span>
          </Link>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Assistant Online</span>
          </div>
          <div className="hidden sm:flex px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl items-center gap-1.5 shadow-xs">
            <span className="text-slate-500 font-medium">Cash Runway:</span>
            <span className="font-extrabold text-slate-900">{metric.cashRunwayDays} Days</span>
          </div>
          <div className="flex px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl items-center gap-1.5 shadow-xs">
            <span className="text-slate-500 font-medium">{t('dash.health_title', 'Health')}:</span>
            <span className="font-extrabold text-emerald-700">{metric.healthScore}/100</span>
          </div>
        </div>
      </div>

      {/* How AI Assistant Works Accordion */}
      <HowItWorksModal title="AI Assistant" steps={assistantSteps} />

      {/* Suggested Prompts Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Quick Financial Questions:
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

              {msg.sender === 'USER' ? (
                <div className="whitespace-pre-line">{msg.content}</div>
              ) : (
                <MarkdownContent content={msg.content} />
              )}

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

              {/* Message Footer: Actions & Model Audit */}
              {msg.sender === 'ASSISTANT' && msg.content && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-indigo-600 flex items-center gap-1 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span>{msg.timestamp}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Analyzing store numbers...</span>
            </div>
            <button
              onClick={handleStopGeneration}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <StopCircle className="w-3 h-3" />
              <span>Stop</span>
            </button>
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
          title="Attach Bill, Receipt or Bank Statement Screenshot for Multimodal Analysis"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            attachedImage
              ? 'Ask AI Copilot about this attached bill / document...'
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

      <VoiceCFOModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        businessId={businessInfo?.id}
      />
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
