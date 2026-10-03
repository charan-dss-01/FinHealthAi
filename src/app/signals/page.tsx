'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { InsightCard } from '@/components/ui/InsightCard';
import { ShieldAlert, AlertTriangle, CheckCircle2, Bot, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SignalsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((d) => {
        if (d.business?.signals) {
          setSignals(d.business.signals);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const alertSteps = [
    { title: 'Monitor Spending Shifts', description: 'We compare your current vendor payments against your typical spending average.' },
    { title: 'Spot Personal Leaks', description: 'We check if personal subscriptions or food orders are drawn from the business account.' },
    { title: 'Provide Recommended Action', description: 'We give you clear, practical steps to protect your cash runway.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            Things to Watch & Business Signals
            <Tooltip text="Automatic warnings and opportunities discovered by analyzing your daily bank transactions." />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clear, actionable alerts telling you what happened, why it matters, and what to do next.
          </p>
        </div>

        {/* How Alerts Work Diagram Accordion */}
        <HowItWorksModal title="Alert Detection" steps={alertSteps} />

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Checking your business alerts...</span>
          </div>
        ) : signals.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 text-xs shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">All Clear!</p>
            <p className="mt-1">No critical warnings or spending anomalies detected in your recent transactions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {signals.map((sig, idx) => (
              <InsightCard
                key={sig.id || idx}
                title={sig.title}
                description={sig.description}
                severity={sig.severity}
                actionText="Ask Assistant About This Alert"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
