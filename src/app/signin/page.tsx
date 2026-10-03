'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Tooltip from '@/components/Tooltip';
import HowItWorksModal from '@/components/HowItWorksModal';
import Link from 'next/link';
import { LogIn, Sparkles, ArrowRight, ShieldCheck, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to sign in.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDemo: true }),
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

  const loginSteps = [
    { title: 'Enter Store Credentials', description: 'Log in with your mobile number or store email address.' },
    { title: 'Load Local Database', description: 'Your store transactions, sales, and money duration load safely from your local SQLite DB.' },
    { title: 'Access AI Assistant', description: 'Get instant business advice and what-if simulation tools.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-md mx-auto px-4 sm:px-6 pt-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-600/25 mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-1.5">
            <span>Sign In to Your Store</span>
            <Tooltip text="Log in to access your business health dashboard, money history, and AI assistant." />
          </h1>
          <p className="text-xs text-slate-500">
            Welcome back! Access your local AI Business Operating System.
          </p>
        </div>

        {/* How Login Works Diagram Accordion */}
        <HowItWorksModal title="Secure Access" steps={loginSteps} />

        {/* Demo Login Quick Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200/80 p-5 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 text-indigo-800 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Instant Demo Access</span>
          </div>
          <p className="text-xs text-slate-600">
            Want to test immediately with <span className="font-bold text-slate-900">Ravi General Store</span> sample data?
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span>⚡ One-Click Demo Login as Ravi General Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Regular Login Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-700 mb-1.5 font-bold">Mobile Number or Email</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. 9845098450 or ravi@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-700 mb-1.5 font-bold">Password</label>
              <div className="relative">
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

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              loading={loading}
              className="w-full font-bold shadow-sm"
            >
              Sign In to Dashboard →
            </Button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Don&apos;t have a store account yet?{' '}
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">
              Create New Store Account
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>100% Private • Data stored in local SQLite database</span>
        </div>
      </main>
    </div>
  );
}
