'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function UploadStatementPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleCSV = `Date,Description,Credit,Debit
01/08/2026,UPI/321849/Swiggy Food Order,,480
02/08/2026,UPI/981244/HUL DISTRIBUTOR BANGALORE,,45000
03/08/2026,BHARATPE SETTLEMENT CREDIT,12500,
04/08/2026,BESCOM ELECTRICITY BILL,,4200
05/08/2026,STORE MANAGER SALARY TRANSFER,,18000
06/08/2026,NETFLIX MONTHLY SUBSCRIPTION,,649`;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        res = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        });
      } else if (pasteText.trim()) {
        res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent: pasteText }),
        });
      } else {
        setError('Please select a CSV file or paste bank statement text.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Statement reading failed.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during statement processing.');
    } finally {
      setLoading(false);
    }
  };

  const uploadSteps = [
    { title: 'Upload or Paste Statement', description: 'Select a CSV file from SBI, HDFC, ICICI, Axis, or Kotak, or paste bank text.' },
    { title: 'Automatic Categorization', description: 'We automatically group payments into store costs vs. personal spends.' },
    { title: 'Instant Dashboard Update', description: 'Your money available, sales, and business health update immediately.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center">
            Add Your Bank Statement
            <Tooltip text="Upload your bank statement CSV to automatically calculate your sales, spending, and money available." />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            We will automatically understand where your money is coming from and where it is going.
          </p>
        </div>

        {/* How Statement Reading Works Accordion */}
        <HowItWorksModal title="Bank Statement Processing" steps={uploadSteps} />

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Option 1: Upload Bank CSV File
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {file && <p className="text-xs font-semibold text-indigo-600 mt-2">Selected: {file.name}</p>}
              </div>
            </div>

            {/* Paste Text Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Option 2: Paste Bank Statement Text
                </label>
                <button
                  type="button"
                  onClick={() => setPasteText(sampleCSV)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Load Sample Statement
                </button>
              </div>
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste CSV rows here (Date, Description, Credit, Debit)..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-sm font-bold shadow-md shadow-indigo-600/20"
            >
              <FileText className="w-4 h-4" />
              <span>Process Statement & Update Dashboard →</span>
            </Button>
          </form>
        </div>

        {result && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5 text-emerald-700">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">We Successfully Read Your Statement!</h3>
              </div>
              <Badge variant="success" icon="check">
                {result.count} Transactions Added
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium block mb-1">Sales Earned</span>
                <span className="text-base font-extrabold text-emerald-700">
                  ₹{result.summary.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium block mb-1">Money Spent</span>
                <span className="text-base font-extrabold text-amber-800">
                  ₹{result.summary.totalExpenses.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium block mb-1">Money Duration</span>
                <span className="text-base font-extrabold text-indigo-700">{result.summary.cashRunwayDays} Days</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 font-medium block mb-1">Business Health</span>
                <span className="text-base font-extrabold text-slate-900">{result.summary.healthScore}/100</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
              <Link
                href="/transactions"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all text-center"
              >
                View Money History →
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm text-center"
              >
                View Updated Dashboard →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
