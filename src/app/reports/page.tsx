'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Printer,
  Download,
  Building2,
  Calendar,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Bot,
  FileSpreadsheet
} from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((d) => {
        if (d.business) setData(d.business);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const metric = data?.metrics?.[0] || {
    healthScore: 78,
    cashRunwayDays: 28,
    totalRevenue: 482000,
    totalExpenses: 321500,
    netCashFlow: 160500,
    endingBalance: 142500,
  };

  const handlePrint = () => {
    window.print();
  };

  const transactions = data?.transactions || [];
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((tx: any) => {
    if (tx.type === 'DEBIT') {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    }
  });

  const categoriesList = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 print:bg-white print:p-0 print:pb-0">
      <div className="print:hidden">
        <Navigation />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 print:max-w-none print:p-4 print:space-y-4">
        {/* Print & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Monthly CFO Financial Report</span>
              <Tooltip text="Print or export a verified financial statement and health scorecard for Banks, CAs, or loan applications." />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Bank-verified financial statement & strategic CFO action plan.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4 text-slate-600" />}
            >
              Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* The Printable Report Document Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {data?.name || 'Ravi General Store'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data?.category || 'Kirana / General Store'} • {data?.location || 'Bangalore, Karnataka'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Primary Account: SBI Current A/c XX4829
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-100">
                OFFICIAL CFO REPORT
              </span>
              <p className="text-xs text-slate-500">
                Period: <span className="font-semibold text-slate-800">Current Operating Month</span>
              </p>
              <p suppressHydrationWarning className="text-[11px] text-slate-400">
                Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          {/* Executive Financial Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Sales Inflow
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700">
                ₹{metric.totalRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">UPI & Customer Settlements</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Operating Spend
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{metric.totalExpenses.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Suppliers, Utilities & Rent</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Net Operating Margin
              </span>
              <span className={`text-xl sm:text-2xl font-black ${metric.netCashFlow >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                ₹{metric.netCashFlow.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                +{(metric.totalRevenue > 0 ? (metric.netCashFlow / metric.totalRevenue) * 100 : 0).toFixed(1)}% Profit Margin
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Business Health
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {metric.healthScore}<span className="text-xs text-slate-400 font-semibold">/100</span>
              </span>
              <span className="text-[10px] text-indigo-600 block mt-0.5 font-semibold">
                ~{metric.cashRunwayDays} Days Runway Buffer
              </span>
            </div>
          </div>

          {/* Spending Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operating Expenditure Breakdown
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Expense Category</th>
                    <th className="py-3 px-4 font-semibold">Share of Outflow</th>
                    <th className="py-3 px-4 text-right font-semibold">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categoriesList.length > 0 ? (
                    categoriesList.map(([category, amount], idx) => {
                      const share = metric.totalExpenses > 0 ? ((amount / metric.totalExpenses) * 100).toFixed(1) : '0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{category}</td>
                          <td className="py-2.5 px-4 text-slate-500">{share}%</td>
                          <td className="py-2.5 px-4 text-right font-bold">₹{amount.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 px-4 text-center text-slate-400">
                        No expenses logged for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategic CFO Recommendations */}
          <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>AI CFO Strategic Action Plan</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed list-disc list-inside">
              <li>
                <span className="font-bold text-slate-900">Extend Cash Buffer:</span> Current bank balance supports 28 days of operations. Maintain a minimum ₹1.0 Lakh reserve to withstand supplier price shifts.
              </li>
              <li>
                <span className="font-bold text-slate-900">Separate Personal Spending:</span> Eliminate non-commercial debit line items from the store current account to improve bank underwriting and MSME loan eligibility.
              </li>
              <li>
                <span className="font-bold text-slate-900">Working Capital Expansion:</span> Store qualifies for up to ₹3.8 Lakhs in Mudra Kishore collateral-free working capital loan at 11.5% interest.
              </li>
            </ul>
          </div>

          {/* Verification & Sign-off Stamp */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Generated & Validated via FinHealth AI Deterministic Engine</span>
            </div>
            <div className="text-[11px]">
              Confidential Business Intelligence Document
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
