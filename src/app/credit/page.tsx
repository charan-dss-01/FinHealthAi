'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { calculateLoanAssessment, calculateEmi, LoanAssessment } from '@/lib/analytics/creditScore';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Landmark,
  Bot,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Percent,
  Calendar,
  FileCheck2
} from 'lucide-react';
import Link from 'next/link';

export default function CreditReadinessPage() {
  const [businessData, setBusinessData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // EMI Simulator States
  const [loanAmount, setLoanAmount] = useState(300000);
  const [tenureMonths, setTenureMonths] = useState(24);
  const [interestRate, setInterestRate] = useState(11.5);

  useEffect(() => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((d) => {
        if (d.business) {
          setBusinessData(d.business);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const metric = businessData?.metrics?.[0] || {
    totalRevenue: 482000,
    totalExpenses: 321500,
    endingBalance: 142500,
    cashRunwayDays: 28,
  };

  const assessment: LoanAssessment = calculateLoanAssessment(
    metric.totalRevenue,
    metric.totalExpenses,
    metric.endingBalance,
    metric.cashRunwayDays
  );

  const monthlyEmi = calculateEmi(loanAmount, interestRate, tenureMonths);
  const totalRepayment = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalRepayment - loanAmount);
  const isEmiSafe = monthlyEmi <= assessment.maxMonthlyEmi;

  const creditSteps = [
    { title: 'Evaluate Cash Flows', description: 'We analyze your average monthly sales and operating profit consistency.' },
    { title: 'Calculate Safe Capacity', description: 'We compute the maximum monthly loan repayment your shop can comfortably handle.' },
    { title: 'Bank Underwriting Check', description: 'We test your account against standard Mudra / MSME bank eligibility criteria.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>MSME & Mudra Loan Readiness</span>
              <Tooltip text="Calculate your shop's bank loan eligibility, safe borrowing limits, and monthly EMI affordability before applying." />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Know your exact borrowing capacity and improve your loan approval chances with banks.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bank-Standard DSCR Math</span>
          </div>
        </div>

        {/* How It Works Accordion */}
        <HowItWorksModal title="Loan Readiness Evaluation" steps={creditSteps} />

        {/* Top Assessment Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Score */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Loan Readiness Score</span>
              <Badge
                variant={assessment.readinessScore >= 75 ? 'success' : assessment.readinessScore >= 60 ? 'warning' : 'critical'}
                icon="check"
              >
                {assessment.readinessGrade} ELIGIBILITY
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-black text-slate-900">{assessment.readinessScore}</span>
                <span className="text-slate-400 font-semibold text-lg">/ 100</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Your strong monthly sales and clean cash runway make your business an attractive candidate for MSME/Mudra collateral-free loans.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>DSCR Buffer:</span>
              <span className="font-bold text-slate-900">{assessment.dscr}x Coverage</span>
            </div>
          </div>

          {/* Card 2: Max Borrowing Limit */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Max Safe Borrowing Limit</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Landmark className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900">
                ₹{(assessment.maxSafeLoanAmount / 100000).toFixed(2)} Lakhs
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Max Safe EMI: ₹{assessment.maxMonthlyEmi.toLocaleString('en-IN')}/mo
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Capped at 35% of monthly operating surplus to prevent default risk.
            </div>
          </div>

          {/* Card 3: Eligible Government Schemes */}
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200/80 p-6 rounded-3xl shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Recommended Schemes</span>
              <Badge variant="indigo">Indian MSME</Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-xs">
                <div className="font-bold text-slate-900">Pradhan Mantri Mudra Yojana (Kishore)</div>
                <div className="text-[11px] text-slate-500">Up to ₹5 Lakhs • Low Interest • No Collateral</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-xs">
                <div className="font-bold text-slate-900">CGTMSE Credit Guarantee Scheme</div>
                <div className="text-[11px] text-slate-500">Working capital expansion loans for retail trade</div>
              </div>
            </div>

            <Link
              href={`/copilot?q=${encodeURIComponent('What documents and steps do I need to apply for a Mudra loan of ₹3 Lakhs for my store?')}`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 pt-1"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI CFO About Application Process →</span>
            </Link>
          </div>
        </div>

        {/* Interactive EMI Calculator & Bank Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* EMI Simulator Slider Panel */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Test an EMI Decision</span>
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isEmiSafe ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {isEmiSafe ? 'Safe Monthly Burden' : '⚠️ Heavy EMI Burden'}
              </span>
            </div>

            {/* Slider 1: Loan Amount */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Required Loan Amount</span>
                <span className="text-indigo-600 font-bold">₹{loanAmount.toLocaleString('en-IN')} (₹{(loanAmount / 100000).toFixed(2)}L)</span>
              </div>
              <input
                type="range"
                min="50000"
                max="1500000"
                step="25000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-indigo-600 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>₹50,000</span>
                <span>₹7.5 Lakhs</span>
                <span>₹15 Lakhs</span>
              </div>
            </div>

            {/* Slider 2: Tenure */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Repayment Duration</span>
                <span className="text-indigo-600 font-bold">{tenureMonths} Months ({(tenureMonths / 12).toFixed(1)} Years)</span>
              </div>
              <input
                type="range"
                min="6"
                max="60"
                step="6"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full accent-indigo-600 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>6 Months</span>
                <span>36 Months</span>
                <span>60 Months</span>
              </div>
            </div>

            {/* Slider 3: Interest Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Annual Interest Rate</span>
                <span className="text-indigo-600 font-bold">{interestRate}% p.a.</span>
              </div>
              <input
                type="range"
                min="8.5"
                max="18.0"
                step="0.5"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-indigo-600 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>8.5% (Govt Subsidized)</span>
                <span>12.0% (Public Bank)</span>
                <span>18.0% (NBFC)</span>
              </div>
            </div>

            {/* Calculation Result Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Estimated Monthly EMI</span>
                <span className={`text-xl font-extrabold ${isEmiSafe ? 'text-indigo-700' : 'text-rose-700'}`}>
                  ₹{monthlyEmi.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Total Interest Payable</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹{totalInterest.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Loan Underwriting Checklist */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Bank Underwriting Checklist</span>
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {assessment.checklist.filter((c) => c.passed).length}/{assessment.checklist.length} Passed
                </span>
              </div>

              <div className="divide-y divide-slate-100 pt-2">
                {assessment.checklist.map((item, idx) => (
                  <div key={idx} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{item.title}</span>
                      {item.passed ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Pass
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Needs Work
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{item.description}</p>
                    {item.recommendation && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-1 font-medium">
                        💡 Tip: {item.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/reports"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Generate Loan-Ready Financial Report →</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
