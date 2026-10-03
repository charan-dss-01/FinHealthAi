'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Filter,
  Upload,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface TransactionItem {
  id: string;
  merchant: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  isBusiness: boolean;
  transactionDate: string;
  createdAt?: string;
}

const COMMON_CATEGORIES = [
  'Inventory & Supplies',
  'Salaries & Payroll',
  'Rent & Facilities',
  'Electricity & Utilities',
  'Personal Expense (Co-mingled)',
  'Customer Revenue',
  'Equipment & Maintenance',
  'Marketing & Signage',
  'Taxes & Government Fees',
  'Other Expense',
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BUSINESS' | 'PERSONAL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Transaction Form State
  const [newTx, setNewTx] = useState({
    merchant: '',
    description: '',
    amount: '',
    type: 'DEBIT',
    category: 'Inventory & Supplies',
    isBusiness: true,
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transactions');
      const d = await res.json();
      if (d.transactions) {
        setTransactions(d.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.merchant || !newTx.amount || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewTx({
          merchant: '',
          description: '',
          amount: '',
          type: 'DEBIT',
          category: 'Inventory & Supplies',
          isBusiness: true,
          transactionDate: new Date().toISOString().split('T')[0],
        });
        await loadTransactions();
      } else {
        alert(data.error || 'Failed to add transaction');
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBusinessFlag = async (id: string, currentFlag: boolean) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isBusiness: !currentFlag,
          category: !currentFlag ? 'General Store Expense' : 'Personal Expense (Co-mingled)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadTransactions();
      }
    } catch (err) {
      console.error('Error updating transaction:', err);
    }
  };

  const handleChangeCategory = async (id: string, category: string) => {
    const isPersonal = category.includes('Personal');
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          category,
          isBusiness: !isPersonal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadTransactions();
      }
    } catch (err) {
      console.error('Error changing category:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction from the database?')) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await loadTransactions();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

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
              Easily search, filter, and separate your store expenses from personal spends with instant database persistence.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-4 h-4 text-indigo-600" />}
            >
              Add Transaction
            </Button>
            <Link
              href="/upload"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Add Bank Statement</span>
            </Link>
          </div>
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
              Personal Spends ({transactions.filter((t) => !txIsBusiness(t)).length})
            </button>
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Reading transaction history from database...</span>
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
                    <th className="py-3.5 px-4 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.transactionDate || tx.createdAt || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{tx.merchant || tx.description}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{tx.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                            tx.type === 'CREDIT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
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
                        <select
                          value={tx.category}
                          onChange={(e) => handleChangeCategory(tx.id, e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          {COMMON_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleBusinessFlag(tx.id, tx.isBusiness)}
                          title="Click to toggle between Store and Personal spend"
                          className="hover:opacity-80 transition-opacity"
                        >
                          {tx.isBusiness ? (
                            <Badge variant="success" size="sm" icon="check">
                              Store Spend (Click to Switch)
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm" icon="warning">
                              Personal Spend (Click to Switch)
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold text-xs ${
                          tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <span>Add Manual Transaction</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merchant / Customer / Payee</label>
                  <input
                    type="text"
                    required
                    value={newTx.merchant}
                    onChange={(e) => setNewTx({ ...newTx, merchant: e.target.value })}
                    placeholder="e.g. HUL Distributor or Cash Sales"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                    <select
                      value={newTx.type}
                      onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="DEBIT">Money Spent (Debit)</option>
                      <option value="CREDIT">Sales Earned (Credit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newTx.amount}
                      onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTx.category}
                    onChange={(e) =>
                      setNewTx({
                        ...newTx,
                        category: e.target.value,
                        isBusiness: !e.target.value.includes('Personal'),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={newTx.transactionDate}
                    onChange={(e) => setNewTx({ ...newTx, transactionDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <Button variant="primary" size="sm" type="submit" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Transaction'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function txIsBusiness(tx: TransactionItem): boolean {
  return tx.isBusiness && !tx.category.toLowerCase().includes('personal');
}
