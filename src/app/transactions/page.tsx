'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Search, Filter, Upload, Receipt, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BUSINESS' | 'PERSONAL'>('ALL');

  useEffect(() => {
    fetch('/api/business')
      .then((res) => res.json())
      .then((d) => {
        if (d.business?.transactions) {
          setTransactions(d.business.transactions);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.merchant || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'BUSINESS') return matchesSearch && tx.isBusiness;
    if (filterType === 'PERSONAL') return matchesSearch && !tx.isBusiness;
    return matchesSearch;
  });

  const transactionSteps = [
    { title: 'Read Bank Statement', description: 'We read your bank lines, merchant titles, and amounts.' },
    { title: 'Identify Category', description: 'We automatically group payments into Inventory, Rent, Utilities, or Revenue.' },
    { title: 'Spot Personal Spends', description: 'We highlight non-business personal expenses like Swiggy, Netflix, or personal shopping.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
              Money History & Transactions
              <Tooltip text="All incoming customer sales and outgoing payments read from your bank statements." />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Easily search, filter, and separate your store expenses from personal spends.
            </p>
          </div>

          <Link
            href="/upload"
            className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Add Bank Statement</span>
          </Link>
        </div>

        {/* How Transactions Work Accordion */}
        <HowItWorksModal title="Transaction Analysis" steps={transactionSteps} />

        {/* Filter & Search Bar Card */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store, merchant, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Spends ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('BUSINESS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'BUSINESS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Store Spends ({transactions.filter((t) => t.isBusiness).length})
            </button>
            <button
              onClick={() => setFilterType('PERSONAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === 'PERSONAL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Personal Spends ({transactions.filter((t) => !t.isBusiness).length})
            </button>
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Reading transaction history...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No transactions match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Merchant / Particulars</th>
                    <th className="py-3.5 px-4 font-semibold">Type</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Classification</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.transactionDate || tx.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{tx.merchant || tx.description}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{tx.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                            tx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tx.type === 'CREDIT' ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Sales Earned
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-slate-400" /> Money Spent
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.isBusiness ? (
                          <Badge variant="success" size="sm" icon="check">
                            Store Spend
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" icon="warning">
                            Personal Spend
                          </Badge>
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold text-xs ${
                          tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
