'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Tooltip from '@/components/Tooltip';
import HowItWorksModal from '@/components/HowItWorksModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, Store, MapPin, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Kirana / General Store',
    location: 'Bangalore, Karnataka',
    employeeCount: 2,
    monthlyRevenueEstimate: 250000,
  });

  const categories = [
    'Kirana / General Store',
    'Retail Apparel Shop',
    'Restaurant / Cafe',
    'Pharmacy / Medical Store',
    'Salon / Beauty Parlour',
    'Small Manufacturer',
    'Local Agency / Service',
    'Distributor / Wholesaler',
    'Other Business',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onboardingSteps = [
    { title: 'Store Profile Setup', description: 'Tell us your store name, business category, and location.' },
    { title: 'Understand Your Money', description: 'Upload a bank statement CSV or connect your UPI merchant account.' },
    { title: 'Get Simple Advice', description: 'Your AI Business Assistant organizes your sales, spending, and recommendations.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center">
            Set Up Your Store Profile
            <Tooltip text="Create your business profile to start tracking sales, spending, and cash duration." />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simple 4-step setup. We&apos;ll automatically organize your sales and spending.
          </p>
        </div>

        {/* How Onboarding Works Accordion */}
        <HowItWorksModal title="Store Setup" steps={onboardingSteps} />

        {/* Progress Bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-700">
                {s === 1 && 'Store Info'}
                {s === 2 && 'Type'}
                {s === 3 && 'Location'}
                {s === 4 && 'Complete'}
              </span>
              {s < 4 && <span className="text-slate-300 hidden sm:inline">→</span>}
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" /> Step 1: What is your store or business name?
                </h3>
                <div>
                  <label className="block text-xs text-slate-700 mb-1.5 font-bold">Store / Business Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ravi General Store"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => formData.name.trim() && setStep(2)}
                  disabled={!formData.name.trim()}
                  className="w-full font-bold shadow-xs"
                >
                  <span>Next: Choose Business Type</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Step 2: What type of business do you run?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: cat });
                        setStep(3);
                      }}
                      className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        formData.category === cat
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" /> Step 3: Location & Staff Details
                </h3>
                <div>
                  <label className="block text-xs text-slate-700 mb-1.5 font-bold">City / Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bangalore, Karnataka"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1.5 font-bold">Number of Staff / Employees</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.employeeCount}
                    onChange={(e) => setFormData({ ...formData, employeeCount: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full font-bold shadow-xs"
                >
                  <span>Next: Review & Complete</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Your Store Profile is Ready!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We&apos;ll start tracking your sales, spending, and money duration for{' '}
                  <span className="text-slate-900 font-bold">{formData.name}</span>.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full font-bold shadow-sm"
                >
                  Go to Home Overview →
                </Button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
