'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Tooltip from '@/components/Tooltip';
import HowItWorksModal from '@/components/HowItWorksModal';
import { SUPPORTED_LANGUAGES, LanguageCode, useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import { UserPlus, Globe, Store, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SignupPage() {
  const router = useRouter();
  const { setLanguage } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Kirana / General Store');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          businessName,
          category,
          preferredLanguage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLanguage(preferredLanguage);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to create store account.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  const signupSteps = [
    { title: 'Store Details', description: 'Enter your owner name, store title, and business category.' },
    { title: 'Choose Preferred Language', description: 'Select English, Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, or Bengali.' },
    { title: 'Instant Operating System', description: 'Your local database profile initializes with health scores and AI assistant.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-lg mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-600/25 mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            <span>Create New Store Account</span>
            <Tooltip text="Register your business to start tracking sales, spending, and money duration in your native language." />
          </h1>
          <p className="text-xs text-slate-500">
            Free 100% local AI Business Operating System setup for Indian SMBs.
          </p>
        </div>

        {/* How Signup Works Diagram Accordion */}
        <HowItWorksModal title="Account Creation" steps={signupSteps} />

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Language Preference Picker */}
            <div>
              <label className="block text-xs text-indigo-900 font-bold mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-600" /> Select Preferred Language / భాష / भाषा
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = preferredLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.code)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-center gap-1">
                        <span>{lang.nativeTitle}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">{lang.englishTitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-700 mb-1.5 font-bold">Owner Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1.5 font-bold">Store / Business Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Ravi General Store"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-700 mb-1.5 font-bold">Mobile Number or Email</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ravi@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1.5 font-bold">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-700 mb-1.5 font-bold flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-indigo-600" /> Business Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                <option value="Kirana / General Store">Kirana / General Store</option>
                <option value="Retail Apparel Shop">Retail Apparel Shop</option>
                <option value="Restaurant / Cafe">Restaurant / Cafe</option>
                <option value="Pharmacy / Medical Store">Pharmacy / Medical Store</option>
                <option value="Salon / Beauty Parlour">Salon / Beauty Parlour</option>
                <option value="Small Manufacturer">Small Manufacturer</option>
                <option value="Local Agency / Service">Local Agency / Service</option>
                <option value="Distributor / Wholesaler">Distributor / Wholesaler</option>
                <option value="Other Business">Other Business</option>
              </select>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-xs font-bold shadow-sm"
            >
              Create Account & Start Operating →
            </Button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have a store account?{' '}
            <Link href="/signin" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">
              Sign In Here
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>100% Private • Stored in local SQLite database</span>
        </div>
      </main>
    </div>
  );
}
