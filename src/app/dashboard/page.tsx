'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Tooltip from '@/components/Tooltip';
import HowItWorksModal from '@/components/HowItWorksModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { InsightCard } from '@/components/ui/InsightCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Wallet, 
  Building2,
  Sparkles,
  ArrowRight,
  ReceiptText,
  Sliders,
  Upload,
  Bot,
  Database,
  Calendar,
  IndianRupee,
  Layers,
  CreditCard,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface BusinessData {
  id: string;
  name: string;
  category: string;
  location: string;
  metrics: Array<{
    healthScore: number;
    cashRunwayDays: number;
    totalRevenue: number;
    totalExpenses: number;
    netCashFlow: number;
    endingBalance: number;
    healthBreakdown?: {
      score: number;
      state: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
      runwayDays: number;
      pillars: {
        runwayScore: number;
        marginScore: number;
        coCominglingScore: number;
        bufferScore: number;
      };
      keyDrivers: string[];
    };
  }>;
  signals: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    score: number;
  }>;
  transactions: Array<{
    id: string;
    merchant: string;
    description: string;
    amount: number;
    type: string;
    category: string;
    isBusiness: boolean;
    transactionDate: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.business) {
          setData(resData.business);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navigation />
        <DashboardSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navigation />
        <div className="pt-16 px-4">
          <EmptyState
            icon={<Building2 className="w-8 h-8" />}
            title="Welcome to FinHealth AI"
            description="Let's set up your business profile to start tracking sales, spending, and money duration."
            actionText="Setup Your Store Profile →"
            actionHref="/onboarding"
          />
        </div>
      </div>
    );
  }

  const metric = data.metrics[0] || {
    healthScore: 78,
    cashRunwayDays: 28,
    totalRevenue: 482000,
    totalExpenses: 321500,
    netCashFlow: 160500,
    endingBalance: 142500,
  };

  const healthScore = metric.healthScore;

  const getHealthBadge = (score: number) => {
    if (score >= 75) {
      return {
        label: 'Doing Well',
        variant: 'success' as const,
        icon: 'check' as const,
        summary: 'Your customer sales are strong and operating money duration is healthy.',
        accentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        ringColor: 'stroke-emerald-500',
      };
    } else if (score >= 60) {
      return {
        label: 'Needs Attention',
        variant: 'warning' as const,
        icon: 'warning' as const,
        summary: 'Your sales are steady, but spending is increasing. Watch your monthly buffer.',
        accentColor: 'text-amber-800 bg-amber-50 border-amber-200',
        ringColor: 'stroke-amber-500',
      };
    } else if (score >= 40) {
      return {
        label: 'At Risk',
        variant: 'warning' as const,
        icon: 'alert' as const,
        summary: 'Your cash runway is getting tight. Consider holding non-essential spending.',
        accentColor: 'text-orange-800 bg-orange-50 border-orange-200',
        ringColor: 'stroke-orange-500',
      };
    } else {
      return {
        label: 'Critical Action Required',
        variant: 'critical' as const,
        icon: 'alert' as const,
        summary: 'Your spending exceeds incoming sales or cash runway is very low. Immediate action needed.',
        accentColor: 'text-rose-700 bg-rose-50 border-rose-200',
        ringColor: 'stroke-rose-500',
      };
    }
  };

  const healthBadge = getHealthBadge(healthScore);

  const getFactorStatus = (type: 'sales' | 'spending' | 'cash' | 'duration') => {
    if (type === 'sales') {
      return metric.totalRevenue >= metric.totalExpenses
        ? { label: 'Good', isPositive: true, text: `Customer sales earned ₹${(metric.totalRevenue / 100000).toFixed(2)} Lakhs this month.` }
        : { label: 'Low', isPositive: false, text: `Sales earned (₹${(metric.totalRevenue / 100000).toFixed(2)}L) are less than spending.` };
    }
    if (type === 'spending') {
      return metric.totalExpenses > metric.totalRevenue
        ? { label: 'High', isPositive: false, text: `Money spent (₹${(metric.totalExpenses / 100000).toFixed(2)}L) exceeds sales earned.` }
        : { label: 'Watch', isPositive: true, text: `Money spent is ₹${(metric.totalExpenses / 100000).toFixed(2)} Lakhs this month.` };
    }
    if (type === 'cash') {
      return metric.endingBalance >= 100000
        ? { label: 'Safe', isPositive: true, text: `You have ₹${(metric.endingBalance / 100000).toFixed(2)} Lakhs safe in your bank account.` }
        : { label: 'Low Cash', isPositive: false, text: `Bank balance is low at ₹${metric.endingBalance.toLocaleString('en-IN')}.` };
    }
    if (type === 'duration') {
      if (metric.cashRunwayDays >= 45) return { label: 'Safe', isPositive: true, text: `Available money duration is ${metric.cashRunwayDays} days.` };
      if (metric.cashRunwayDays >= 20) return { label: `~${metric.cashRunwayDays} Days`, isPositive: true, text: `Money duration is ${metric.cashRunwayDays} days.` };
      return { label: `${metric.cashRunwayDays} Days!`, isPositive: false, text: `Critical: Money duration is only ${metric.cashRunwayDays} days.` };
    }
    return { label: 'Good', isPositive: true, text: '' };
  };

  const salesTrendData = [
    { month: 'Week 1', sales: Math.round(metric.totalRevenue * 0.22), spending: Math.round(metric.totalExpenses * 0.24) },
    { month: 'Week 2', sales: Math.round(metric.totalRevenue * 0.26), spending: Math.round(metric.totalExpenses * 0.25) },
    { month: 'Week 3', sales: Math.round(metric.totalRevenue * 0.24), spending: Math.round(metric.totalExpenses * 0.25) },
    { month: 'Week 4', sales: Math.round(metric.totalRevenue * 0.28), spending: Math.round(metric.totalExpenses * 0.26) },
  ];

  const healthSteps = [
    { title: 'Understand Spending & Income', description: 'We read your recent customer sales and store payments.' },
    { title: 'Check Money Duration', description: 'We estimate how long your money will support current business operations.' },
    { title: 'Spot Personal & Supplier Spends', description: 'We identify unexpected spending and personal bill leaks.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Welcome Greeting Header Card */}
        <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Good morning, {data.name}! 👋
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>AI Business Operating System</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                <Database className="w-3.5 h-3.5 text-indigo-600" /> Stored in local SQLite
              </span>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-semibold self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Business Assistant Active</span>
          </div>
        </div>

        {/* Business Health Widget & 4 Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Business Health Card */}
          <div className="lg:col-span-6 bg-gradient-to-br from-white via-indigo-50/30 to-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-sm flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                Business Health
                <Tooltip text="A simple 0-100 score showing how stable your business is based on sales, spending, and money available." />
              </span>
              <Badge variant={healthBadge.variant} icon={healthBadge.icon}>
                {healthBadge.label}
              </Badge>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900">{healthScore}</span>
              <span className="text-slate-400 font-semibold text-xl">/ 100</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              {healthBadge.summary}
            </p>

            {/* Factor Breakdown Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-200/70 text-xs">
              <button
                onClick={() => setSelectedFactor(selectedFactor === 'sales' ? null : 'sales')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedFactor === 'sales'
                    ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 font-medium block">Sales</span>
                <span className={`text-xs font-bold ${getFactorStatus('sales').isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {getFactorStatus('sales').label}
                </span>
              </button>

              <button
                onClick={() => setSelectedFactor(selectedFactor === 'spending' ? null : 'spending')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedFactor === 'spending'
                    ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 font-medium block">Money Spent</span>
                <span className="text-xs font-bold text-amber-700">{getFactorStatus('spending').label}</span>
              </button>

              <button
                onClick={() => setSelectedFactor(selectedFactor === 'cash' ? null : 'cash')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedFactor === 'cash'
                    ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 font-medium block">Available</span>
                <span className={`text-xs font-bold ${getFactorStatus('cash').isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {getFactorStatus('cash').label}
                </span>
              </button>

              <button
                onClick={() => setSelectedFactor(selectedFactor === 'duration' ? null : 'duration')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedFactor === 'duration'
                    ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[11px] text-slate-400 font-medium block">Duration</span>
                <span className="text-xs font-bold text-indigo-700">{getFactorStatus('duration').label}</span>
              </button>
            </div>

            {selectedFactor && (
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs text-indigo-900 animate-fade-in">
                {selectedFactor === 'sales' && getFactorStatus('sales').text}
                {selectedFactor === 'spending' && getFactorStatus('spending').text}
                {selectedFactor === 'cash' && getFactorStatus('cash').text}
                {selectedFactor === 'duration' && getFactorStatus('duration').text}
              </div>
            )}
          </div>

          {/* 4 Essential Metric Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              title="Money Available"
              value={`₹${(metric.endingBalance / 100000).toFixed(2)} Lakhs`}
              subtitle="SBI Current A/c XX4829"
              tooltip="The exact cash currently available in your business bank account."
              icon={<Wallet className="w-5 h-5" />}
              variant="indigo"
            />

            <MetricCard
              title="Sales Earned"
              value={`₹${(metric.totalRevenue / 100000).toFixed(2)} Lakhs`}
              tooltip="Total customer payments and UPI settlements received this month."
              trend={{
                value: '+14%',
                isPositive: true,
                label: 'vs last month'
              }}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="positive"
            />

            <MetricCard
              title="Money Spent"
              value={`₹${(metric.totalExpenses / 100000).toFixed(2)} Lakhs`}
              tooltip="Total money paid out for inventory, utilities, rent, and staff expenses."
              trend={{
                value: '+6%',
                isPositive: false,
                label: 'supplier cost'
              }}
              icon={<TrendingDown className="w-5 h-5" />}
              variant="warning"
            />

            <MetricCard
              title="Money Left Over"
              value={`₹${(metric.netCashFlow / 100000).toFixed(2)} Lakhs`}
              tooltip="Money remaining after paying all store expenses this month."
              subtitle={metric.netCashFlow >= 0 ? 'Positive profit margin' : 'Negative monthly cash flow'}
              icon={<Layers className="w-5 h-5" />}
              variant={metric.netCashFlow >= 0 ? 'positive' : 'critical'}
            />
          </div>
        </div>

        {/* How Business Health Works Accordion */}
        <HowItWorksModal title="Business Health" steps={healthSteps} />

        {/* Action-First Alerts / Insight Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Important Things to Know</span>
              <span className="px-2.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-semibold border border-slate-200">
                {data.signals.length} Active
              </span>
            </h2>
            <Link href="/signals" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
              View All Alerts →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.signals.slice(0, 2).map((sig) => (
              <InsightCard
                key={sig.id}
                title={sig.title}
                description={sig.description}
                severity={sig.severity}
                actionText="Ask Assistant About This"
              />
            ))}
          </div>
        </div>

        {/* Interactive Question Chart */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Are my sales improving?</h2>
              <p className="text-xs text-slate-500">Weekly breakdown of incoming sales vs. money spent</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sales Earned
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Money Spent
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                />
                <Area type="monotone" dataKey="sales" name="Sales Earned" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="spending" name="Money Spent" stroke="#6366f1" fillOpacity={1} fill="url(#colorSpending)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/transactions"
            className="bg-white border border-slate-200/80 hover:border-indigo-300 p-5 rounded-2xl transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ReceiptText className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Money History</h3>
              <p className="text-xs text-slate-500 mt-1">Search & filter store vs. personal spends</p>
            </div>
          </Link>

          <Link
            href="/simulator"
            className="bg-white border border-slate-200/80 hover:border-amber-300 p-5 rounded-2xl transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Test a Decision</h3>
              <p className="text-xs text-slate-500 mt-1">Model sales changes, staff hiring & cost inflation</p>
            </div>
          </Link>

          <Link
            href="/credit"
            className="bg-white border border-slate-200/80 hover:border-blue-300 p-5 rounded-2xl transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Loan Readiness</h3>
              <p className="text-xs text-slate-500 mt-1">Mudra & MSME loan borrowing limits</p>
            </div>
          </Link>

          <Link
            href="/upload"
            className="bg-white border border-slate-200/80 hover:border-emerald-300 p-5 rounded-2xl transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Add Bank Statement</h3>
              <p className="text-xs text-slate-500 mt-1">Upload CSV or paste bank text</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
