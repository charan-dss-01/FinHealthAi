'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import {
  LayoutDashboard,
  ReceiptText,
  ShieldAlert,
  Sliders,
  Upload,
  Bot,
  PlusCircle,
  LogIn,
  LogOut,
  Menu,
  X,
  CreditCard,
  FileSpreadsheet,
  BookOpen,
  ChevronDown,
  Sparkles,
  PieChart,
  TrendingUp,
  ShieldCheck,
  Building2,
  HelpCircle,
  Layers,
  ArrowRight,
  User
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth state
  const [user, setUser] = useState<any | null>(null);
  const [business, setBusiness] = useState<any | null>(null);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const isPublicPage = pathname === '/' || pathname === '/landing';

  // Check auth session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          setBusiness(data.business);
        } else {
          setUser(null);
          setBusiness(null);
        }
      })
      .catch(() => {
        setUser(null);
        setBusiness(null);
      });
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      setBusiness(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all shadow-xs" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center font-black text-white shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <span className="text-xs tracking-tighter font-extrabold">₹</span>
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 tracking-tight block leading-none">
                  FinHealth <span className="text-indigo-600">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  SMB Financial Copilot
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {isPublicPage && !user ? (
              /* Public Landing Page Navbar (Unauthenticated) */
              <div className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-slate-600">
                {/* Product Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('product')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                      openDropdown === 'product' ? 'bg-slate-100 text-slate-900' : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>Product</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdown === 'product' ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === 'product' && (
                    <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-fade-in divide-y divide-slate-100">
                      <div className="space-y-1 pb-2">
                        <Link
                          href="/signin"
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <PieChart className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">Business Health Dashboard</div>
                            <div className="text-[11px] text-slate-500 font-normal">0-100 score, sales velocity & runway buffer</div>
                          </div>
                        </Link>

                        <Link
                          href="/signin"
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <ReceiptText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">Money History</div>
                            <div className="text-[11px] text-slate-500 font-normal">Categorize store spending vs personal leaks</div>
                          </div>
                        </Link>

                        <Link
                          href="/signin"
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">Things to Watch</div>
                            <div className="text-[11px] text-slate-500 font-normal">Proactive spending shifts and cost warnings</div>
                          </div>
                        </Link>
                      </div>

                      <div className="space-y-1 pt-2">
                        <Link
                          href="/signin"
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Sliders className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">Decision Simulator</div>
                            <div className="text-[11px] text-slate-500 font-normal">Model staff hiring, sales drops & inflation</div>
                          </div>
                        </Link>

                        <Link
                          href="/signin"
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">Mudra & MSME Loan Readiness</div>
                            <div className="text-[11px] text-slate-500 font-normal">Safe borrowing capacity & EMI affordability</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Solutions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('solutions')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                      openDropdown === 'solutions' ? 'bg-slate-100 text-slate-900' : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>Solutions</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdown === 'solutions' ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === 'solutions' && (
                    <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-fade-in space-y-1">
                      <a href="#personas" onClick={() => setOpenDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50">
                        <div className="font-bold text-slate-900 text-xs">For Kirana & General Stores</div>
                        <div className="text-[11px] text-slate-500">Track daily UPI settlements & customer credit</div>
                      </a>
                      <a href="#personas" onClick={() => setOpenDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50">
                        <div className="font-bold text-slate-900 text-xs">For Retail & Apparel Shops</div>
                        <div className="text-[11px] text-slate-500">Inventory payment cycles & seasonal cash planning</div>
                      </a>
                      <a href="#personas" onClick={() => setOpenDropdown(null)} className="block p-2.5 rounded-xl hover:bg-slate-50">
                        <div className="font-bold text-slate-900 text-xs">For Restaurants & Cafes</div>
                        <div className="text-[11px] text-slate-500">Perishable stock margins & staff payroll buffers</div>
                      </a>
                    </div>
                  )}
                </div>

                <a href="#how-it-works" className="px-3 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  How It Works
                </a>
                <a href="#personas" className="px-3 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Who It&apos;s For
                </a>
              </div>
            ) : (
              /* Authenticated In-App Header (Hierarchical App Navigation) */
              <div className="hidden lg:flex items-center space-x-1 text-xs font-semibold">
                {/* 1. Dashboard Link */}
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all ${
                    pathname === '/dashboard'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <LayoutDashboard className={`w-3.5 h-3.5 ${pathname === '/dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Dashboard</span>
                </Link>

                {/* 2. Money ▾ (Transactions, Khaata, Upload) */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('money')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                      pathname === '/transactions' || pathname === '/khaata' || pathname === '/upload'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Money</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openDropdown === 'money' ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === 'money' && (
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
                      <Link
                        href="/transactions"
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                          pathname === '/transactions' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ReceiptText className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-semibold">Money History</div>
                          <div className="text-[10px] text-slate-400 font-normal">All store transactions & categorization</div>
                        </div>
                      </Link>

                      <Link
                        href="/khaata"
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                          pathname === '/khaata' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-semibold">Customer Khaata</div>
                          <div className="text-[10px] text-slate-400 font-normal">Udhar credit ledger & receivables</div>
                        </div>
                      </Link>

                      <Link
                        href="/upload"
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                          pathname === '/upload' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-semibold">Upload Bank Statement</div>
                          <div className="text-[10px] text-slate-400 font-normal">Add bank CSV or paste text</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3. Insights ▾ (Signals, CFO Reports) */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('insights')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                      pathname === '/signals' || pathname === '/reports'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    <span>Insights</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openDropdown === 'insights' ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === 'insights' && (
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
                      <Link
                        href="/signals"
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                          pathname === '/signals' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-semibold">Things to Watch</div>
                          <div className="text-[10px] text-slate-400 font-normal">Critical alerts & spending shifts</div>
                        </div>
                      </Link>

                      <Link
                        href="/reports"
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                          pathname === '/reports' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-semibold">CFO Financial Report</div>
                          <div className="text-[10px] text-slate-400 font-normal">Print-ready P&L & health statement</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 4. Planning ▾ (Simulator, Credit Readiness) */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('planning')}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                      pathname === '/simulator' || pathname === '/credit'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>Planning</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openDropdown === 'planning' ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === 'planning' && (
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in space-y-1">
                      <Link
                        href="/simulator"
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                          pathname === '/simulator' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-semibold">Decision Simulator</div>
                          <div className="text-[10px] text-slate-400 font-normal">Test hiring staff & price changes</div>
                        </div>
                      </Link>

                      <Link
                        href="/credit"
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs transition-colors ${
                          pathname === '/credit' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-semibold">Mudra & Loan Readiness</div>
                          <div className="text-[10px] text-slate-400 font-normal">Safe borrowing capacity & EMI math</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 5. AI Copilot Link */}
                <Link
                  href="/copilot"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all ${
                    pathname === '/copilot'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Bot className={`w-3.5 h-3.5 ${pathname === '/copilot' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>AI Copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                </Link>
              </div>
            )}
          </div>

          {/* Right side tools: Language Selector, Auth State */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {user ? (
              /* Authenticated User Menu */
              <div className="flex items-center space-x-2">
                <Link
                  href="/"
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Public Site
                </Link>

                <LanguageSelector />

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-bold text-slate-800 truncate max-w-[120px]">
                    {business?.name || user.name}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition-all active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              /* Unauthenticated Visitor Menu */
              <div className="flex items-center space-x-2">
                <LanguageSelector />

                <Link
                  href="/signin"
                  className="inline-flex items-center space-x-1 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center space-x-1 text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Structured Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-lg max-h-[85vh] overflow-y-auto">
          {user ? (
            /* Logged in mobile menu */
            <>
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  Store Dashboard ({business?.name || user.name})
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                    pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  <span>Business Overview Dashboard</span>
                </Link>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  Money & Ledger
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <Link
                    href="/transactions"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/transactions' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ReceiptText className="w-4 h-4 text-emerald-600" />
                    <span>Money History & Transactions</span>
                  </Link>
                  <Link
                    href="/khaata"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/khaata' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Customer Khaata & Udhar</span>
                  </Link>
                  <Link
                    href="/upload"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/upload' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Add Bank Statement CSV</span>
                  </Link>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  Insights & Planning
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <Link
                    href="/signals"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/signals' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Things to Watch (Alerts)</span>
                  </Link>
                  <Link
                    href="/simulator"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/simulator' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span>Decision Simulator</span>
                  </Link>
                  <Link
                    href="/credit"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/credit' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Mudra & Loan Readiness</span>
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/reports' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                    <span>Monthly CFO Report</span>
                  </Link>
                  <Link
                    href="/copilot"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                      pathname === '/copilot' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Ask AI Copilot</span>
                  </Link>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2.5 text-xs font-bold text-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200"
                >
                  Log Out ({user.name})
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated mobile menu */
            <>
              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Home Overview
                </Link>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  How It Works
                </a>
                <a
                  href="#personas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Who It&apos;s For
                </a>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-center px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-center px-3 py-2.5 rounded-xl bg-indigo-600 text-white shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
