'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Sliders,
  Bot,
  ReceiptText,
  Building2,
  CheckCircle2,
  Lock,
  Globe,
  PieChart,
  ChevronRight,
  Store,
  Utensils,
  ShoppingBag,
  Truck,
  Check,
  AlertTriangle,
  Wallet,
  Calendar,
  IndianRupee,
  Layers,
  HelpCircle,
  Clock,
  FileSpreadsheet,
  BookOpen,
  CreditCard,
  Pencil,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  Flame,
  Activity,
  Play,
  RotateCcw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function HomePage() {
  // PRO Interactive Hero Scenario Simulator State
  const [heroScenario, setHeroScenario] = useState<'normal' | 'festive' | 'spike' | 'clean'>('normal');
  const [activePreviewTab, setActivePreviewTab] = useState<'overview' | 'sales' | 'spending' | 'runway'>('overview');
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(0);

  // Scenario Data Configurations for the PRO Hero Simulator
  const scenarios = {
    normal: {
      name: 'Normal Monthly Rhythm',
      healthScore: 78,
      healthBadge: 'Doing Well',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      revenue: '₹4.82L',
      revenueDelta: '+14% this month',
      isRevenuePos: true,
      expenses: '₹3.21L',
      expenseSub: 'Standard supplier spend',
      balance: '₹1.42L',
      runway: '28 Days',
      runwaySub: 'Healthy operating buffer',
      cfoQuote: '“Ravi-ji, your store cash flow is healthy. You have a 28-day buffer and qualify for ₹3.8L Mudra loan.”',
      alert: {
        type: 'info',
        text: 'All vendor payments balanced with daily customer UPI collections.',
      },
      chart: [
        { month: 'Week 1', sales: 106000, spending: 77000 },
        { month: 'Week 2', sales: 125000, spending: 80000 },
        { month: 'Week 3', sales: 115000, spending: 80000 },
        { month: 'Week 4', sales: 136000, spending: 84500 },
      ],
    },
    festive: {
      name: 'Festive / Wedding Rush 🚀',
      healthScore: 94,
      healthBadge: 'Outstanding Flow',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black',
      revenue: '₹7.15L',
      revenueDelta: '+48% seasonal spike',
      isRevenuePos: true,
      expenses: '₹4.10L',
      expenseSub: 'Bulk inventory re-stock',
      balance: '₹3.05L',
      runway: '45 Days',
      runwaySub: 'Excellent surplus runway',
      cfoQuote: '“Peak seasonal demand! Net profit margin jumped to 42%. Safe to hire a seasonal helper.”',
      alert: {
        type: 'positive',
        text: 'Surplus cash reached ₹3.05 Lakhs. Working capital runway extended to 45 Days.',
      },
      chart: [
        { month: 'Week 1', sales: 155000, spending: 95000 },
        { month: 'Week 2', sales: 190000, spending: 105000 },
        { month: 'Week 3', sales: 175000, spending: 100000 },
        { month: 'Week 4', sales: 195000, spending: 110000 },
      ],
    },
    spike: {
      name: 'Supplier Cost Spike ⚠️',
      healthScore: 46,
      healthBadge: 'At Risk',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-black',
      revenue: '₹4.82L',
      revenueDelta: 'Sales flat (0%)',
      isRevenuePos: false,
      expenses: '₹4.65L',
      expenseSub: '+44% vendor price hike',
      balance: '₹65,000',
      runway: '14 Days',
      runwaySub: '⚠️ Critical runway warning',
      cfoQuote: '“Warning: Wholesale supplier price jump squeezed your margins. Postpone non-essential buys.”',
      alert: {
        type: 'critical',
        text: 'Oil & dairy vendor prices rose +44%. Monthly cash runway is down to 14 Days.',
      },
      chart: [
        { month: 'Week 1', sales: 118000, spending: 112000 },
        { month: 'Week 2', sales: 120000, spending: 118000 },
        { month: 'Week 3', sales: 119000, spending: 115000 },
        { month: 'Week 4', sales: 125000, spending: 120000 },
      ],
    },
    clean: {
      name: 'Stop Personal Leaks 💡',
      healthScore: 88,
      healthBadge: 'Optimized Margin',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-black',
      revenue: '₹4.82L',
      revenueDelta: '+14% this month',
      isRevenuePos: true,
      expenses: '₹2.95L',
      expenseSub: 'Zero non-store spending',
      balance: '₹1.87L',
      runway: '36 Days',
      runwaySub: '+8 Days extended runway',
      cfoQuote: '“Clean bank separation! Removing Swiggy/personal debits increased your bank approval rating to 92%.”',
      alert: {
        type: 'clean',
        text: '100% commercial transactions. Bank statement ready for instant Mudra loan clearance.',
      },
      chart: [
        { month: 'Week 1', sales: 110000, spending: 71000 },
        { month: 'Week 2', sales: 125000, spending: 74000 },
        { month: 'Week 3', sales: 117000, spending: 73000 },
        { month: 'Week 4', sales: 130000, spending: 77000 },
      ],
    },
  };

  const current = scenarios[heroScenario];

  const languages = [
    { code: 'en', native: 'English', text: 'Know how your business is doing. Know what to do next.' },
    { code: 'te', native: 'తెలుగు', text: 'మీ వ్యాపార విక్రయాలు మరియు లాభాలను సులభంగా అర్థం చేసుకోండి.' },
    { code: 'hi', native: 'हिन्दी', text: 'बिना अकाउंटेंट के अपनी दुकान की बिक्री और बचत को समझें।' },
    { code: 'ta', native: 'தமிழ்', text: 'உங்கள் வணிக விற்பனை மற்றும் செலவுகளை எளிதாக புரிந்து கொள்ளுங்கள்.' },
    { code: 'kn', native: 'ಕನ್ನಡ', text: 'ನಿಮ್ಮ ಅಂಗಡಿಯ ಆದಾಯ ಮತ್ತು ಖರ್ಚುಗಳನ್ನು ಸುಲಭವಾಗಿ ತಿಳಿಯಿರಿ.' },
    { code: 'ml', native: 'മലയാളം', text: 'നിങ്ങളുടെ ബിസിനസ്സ് ആരോഗ്യവും പണവും ലളിതമായി അറിയുക.' },
    { code: 'mr', native: 'मराठी', text: 'आपल्या दुकानाची विक्री आणि रोख शिल्लक सहजपणे समजून घ्या.' },
    { code: 'bn', native: 'বাংলা', text: 'আপনার দোকানের আয় ಮತ್ತು ব্যয়ের সঠিক হিসাব সহজে জানুন।' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* 1. Public SaaS Navigation */}
      <Navigation />

      {/* 2. PRO Interactive Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28 border-b border-slate-200/60 bg-gradient-to-b from-indigo-50/50 via-white to-[#F8FAFC]">
        {/* Ambient Glows */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-200/35 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-8 w-[400px] h-[250px] bg-emerald-200/25 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-indigo-200/80 text-indigo-700 text-xs font-extrabold shadow-xs backdrop-blur-md animate-fade-in">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
            <span>AI Financial Operating System for Indian SMBs</span>
          </div>

          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Know how your store is doing.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
                Know what to do next.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Understand your sales, supplier spending, available cash, and business health without needing to be a finance expert.
            </p>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              <span>⚡ Open Live Demo Store</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold rounded-2xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Create Store Account</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-1 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Private Local Storage (SQLite)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              No Accounting Jargon
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Available in 8 Indian Languages
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PRO INTERACTIVE LIVE STORE SIMULATOR IN HERO                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="pt-8 max-w-5xl mx-auto">
            {/* Interactive Scenario Control Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 px-2 text-xs font-bold text-slate-700">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Interactive Live Sandbox:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setHeroScenario('normal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    heroScenario === 'normal'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🟢 Normal Month
                </button>
                <button
                  onClick={() => setHeroScenario('festive')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    heroScenario === 'festive'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🚀 Festive Rush
                </button>
                <button
                  onClick={() => setHeroScenario('spike')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    heroScenario === 'spike'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ⚠️ Price Hike
                </button>
                <button
                  onClick={() => setHeroScenario('clean')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    heroScenario === 'clean'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  💡 Clean Leaks
                </button>
              </div>
            </div>

            {/* Main Interactive Product Canvas */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/70 text-left space-y-6 transition-all">
              {/* Store Header with Live Health Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm shadow-indigo-600/30">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">Ravi General Store</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        SBI A/c XX4829
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Modeled Scenario: <span className="font-semibold text-slate-700">{current.name}</span></p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${current.badgeClass}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                  <span>Business Health: {current.healthScore}/100 ({current.healthBadge})</span>
                </div>
              </div>

              {/* Dynamic 4-Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-500 font-semibold block">Sales Inflow</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {current.revenue}
                  </div>
                  <span className={`text-[11px] font-bold block ${current.isRevenuePos ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {current.revenueDelta}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-500 font-semibold block">Money Spent</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {current.expenses}
                  </div>
                  <span className="text-amber-700 font-semibold text-[11px] block">
                    {current.expenseSub}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-500 font-semibold block">Money Available</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {current.balance}
                  </div>
                  <span className="text-indigo-600 font-semibold text-[11px] block">
                    Current Bank Balance
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <span className="text-slate-500 font-semibold block">Cash Runway</span>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight">
                    {current.runway}
                  </div>
                  <span className="text-slate-500 font-semibold text-[11px] block">
                    {current.runwaySub}
                  </span>
                </div>
              </div>

              {/* Dynamic Chart & AI CFO Verdict */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Dynamic Area Chart */}
                <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200/70 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">Weekly Cash Flow Dynamics</span>
                    <div className="flex items-center space-x-3 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sales
                      </span>
                      <span className="flex items-center gap-1 text-indigo-700">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> Spend
                      </span>
                    </div>
                  </div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={current.chart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="heroSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="heroSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${(v/1000)}k`} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                        <Area type="monotone" dataKey="sales" stroke="#10b981" fillOpacity={1} fill="url(#heroSales)" strokeWidth={2.5} />
                        <Area type="monotone" dataKey="spending" stroke="#6366f1" fillOpacity={1} fill="url(#heroSpend)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI CFO Advice Box */}
                <div className="lg:col-span-5 bg-indigo-50/80 border border-indigo-200/80 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-xs uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      <span>AI CFO Copilot Verdict</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {current.cfoQuote}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-indigo-200/60 text-[11px] text-indigo-800 font-semibold flex items-center justify-between">
                    <span>{current.alert.text}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works (Visual 5-Step Flow) */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Simple 5-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How FinHealth AI Works for Your Store
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              No balance sheets. No complex formulas. Just clear visibility and actionable advice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Connect or Upload</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your bank statement CSV or paste transaction rows from SBI, HDFC, ICICI, or Axis.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Organize Activity</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Transactions automatically group into Customer Sales, Inventory, Rent, Wages, and Bills.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Understand Health</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We calculate your 0-100 Business Health Score and how many days your money will last.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Find Key Changes</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Spot vendor price increases, sudden spending spikes, and personal Swiggy/shopping leaks.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center">
                5
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Know What To Do</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Get clear recommendations, test hiring decisions on sliders, and check loan eligibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities Grid */}
      <section className="py-20 md:py-28 bg-[#F8FAFC] border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to keep your business profitable
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Understand Your Money</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  See where your customer money is coming from and where store expenses are going, clearly separated from personal household spending.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">UPI Settlements:</span>
                <span className="font-bold text-emerald-600">+₹2.10 Lakhs</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Know Your Business Health</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  A single 0-100 score combining your sales strength, supplier spending speed, and available cash buffer into an easy color rating.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900">Current Health:</span>
                <span className="font-extrabold text-emerald-700">78/100 (Doing Well)</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Catch Problems Early</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Automatic warnings when supplier prices jump unexpectedly, when personal subscriptions leak, or when cash duration drops below 20 days.
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900">Active Alert:</span>
                <span className="font-bold text-amber-800">Supplier Price Spike Detected</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">See What&apos;s Coming</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Understand what your bank balance will look like 30, 60, and 90 days from now based on your real daily operating rhythm.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900">90-Day Expected Cash:</span>
                <span className="font-bold text-blue-700">₹2.85 Lakhs Safe</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Test Decisions on Sliders</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Before hiring a helper at ₹18,000/mo or taking on new supplier bills, test the financial outcome in a sandbox simulator.
                </p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-900">Hiring Helper Verdict:</span>
                <span className="font-bold text-indigo-700">Safe Decision</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">24/7 AI Business Assistant</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ask questions in your native Indian language (Telugu, Hindi, Tamil, etc.) and receive plain-language answers grounded in your numbers.
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-900">Language Support:</span>
                <span className="font-bold text-purple-700">8 Indian Languages</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Target SMB Personas */}
      <section id="personas" className="py-20 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Target SMB Personas
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for real Indian retail & trade businesses
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 text-left hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Kirana & General Stores</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track BharatPe/Paytm QR settlements, distributor invoices from HUL/ITC, and manage customer credit (Udhar).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 text-left hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Apparel & Footwear Shops</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage seasonal inventory ordering for Diwali/Eid, track stock cash flow, and avoid over-purchasing stock.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 text-left hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Restaurants, Cafes & Bakeries</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Monitor perishable raw ingredient spending, calculate daily food cost margins, and protect staff payroll cash.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3 text-left hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Distributors & Wholesalers</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Monitor retail receivables, supplier credit payback deadlines, and compute Mudra working capital limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Multilingual Section */}
      <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Inclusive Indian Accessibility
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Operate your store in your native mother tongue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select any language below to see how FinHealth AI communicates with you:
            </p>
          </div>

          {/* Language Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {languages.map((lang, idx) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguageIndex(idx)}
                className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                  selectedLanguageIndex === idx
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {lang.native}
              </button>
            ))}
          </div>

          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl text-base sm:text-lg font-bold text-slate-800 shadow-xs animate-fade-in">
            &quot;{languages[selectedLanguageIndex].text}&quot;
          </div>
        </div>
      </section>

      {/* 7. Final High-Conversion CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to take control of your store finances?
          </h2>
          <p className="text-sm sm:text-base text-indigo-200 max-w-xl mx-auto">
            Get instant clarity on your sales, profit margins, cash runway, and loan readiness in less than 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-950 hover:bg-slate-100 font-extrabold rounded-2xl text-sm shadow-xl transition-all active:scale-95"
            >
              Open Live Dashboard →
            </Link>
            <Link
              href="/signin"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-700/60 hover:bg-indigo-700 border border-indigo-400/50 text-white font-extrabold rounded-2xl text-sm transition-all active:scale-95"
            >
              1-Click Demo Login as Ravi Store
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Comprehensive Fintech Footer */}
      <footer className="py-12 bg-white border-t border-slate-200 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-left">
            <div className="col-span-2 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <span className="font-extrabold text-slate-900 text-sm">FinHealth AI</span>
              </div>
              <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                Smart financial intelligence, cash runway forecasting, and AI CFO assistant for small and medium businesses in India.
              </p>
              <div className="text-[11px] text-slate-400 pt-2 font-mono">
                100% Local SQLite Storage • Zero External Tracking
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Product</div>
              <ul className="space-y-1.5 text-slate-600">
                <li><Link href="/dashboard" className="hover:text-indigo-600">Business Health</Link></li>
                <li><Link href="/transactions" className="hover:text-indigo-600">Money History</Link></li>
                <li><Link href="/signals" className="hover:text-indigo-600">Things to Watch</Link></li>
                <li><Link href="/khaata" className="hover:text-indigo-600">Customer Khaata</Link></li>
                <li><Link href="/simulator" className="hover:text-indigo-600">Decision Simulator</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Solutions</div>
              <ul className="space-y-1.5 text-slate-600">
                <li><Link href="/credit" className="hover:text-indigo-600">Mudra Loan Readiness</Link></li>
                <li><Link href="/reports" className="hover:text-indigo-600">CFO Financial Reports</Link></li>
                <li><Link href="/copilot" className="hover:text-indigo-600">Ask AI Copilot</Link></li>
                <li><Link href="/upload" className="hover:text-indigo-600">Bank Statement Ingestion</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Account</div>
              <ul className="space-y-1.5 text-slate-600">
                <li><Link href="/signin" className="hover:text-indigo-600">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-indigo-600">Register Store</Link></li>
                <li><Link href="/onboarding" className="hover:text-indigo-600">Setup Wizard</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-2">
            <div>© {new Date().getFullYear()} FinHealth AI. All rights reserved.</div>
            <div className="flex space-x-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
