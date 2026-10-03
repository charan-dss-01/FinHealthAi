'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  IndianRupee,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface KhaataEntry {
  id: string;
  customerName: string;
  phone: string;
  amount: number;
  description: string;
  date: string;
  dueDate: string;
  status: 'PENDING' | 'SETTLED';
}

export default function KhaataPage() {
  const [entries, setEntries] = useState<KhaataEntry[]>([
    {
      id: '1',
      customerName: 'Suresh Gowda',
      phone: '9845012345',
      amount: 3200,
      description: 'Monthly grocery provisions & oil tin',
      date: '2026-08-20',
      dueDate: '2026-09-05',
      status: 'PENDING',
    },
    {
      id: '2',
      customerName: 'Lakshmi Narayana',
      phone: '9845098765',
      amount: 1850,
      description: 'Rice bag 25kg & masala packets',
      date: '2026-08-24',
      dueDate: '2026-09-07',
      status: 'PENDING',
    },
    {
      id: '3',
      customerName: 'Ramesh Reddy',
      phone: '9448055443',
      amount: 4500,
      description: 'Festival dry fruits & dairy stock',
      date: '2026-08-15',
      dueDate: '2026-08-30',
      status: 'PENDING',
    },
    {
      id: '4',
      customerName: 'Manjunath Swamy',
      phone: '9880011223',
      amount: 2100,
      description: 'Ghee, sugar, tea packets',
      date: '2026-08-10',
      dueDate: '2026-08-25',
      status: 'SETTLED',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'SETTLED'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New entry form state
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    phone: '',
    amount: '',
    description: '',
    dueDate: '',
  });

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.customerName || !newCustomer.amount) return;

    const entry: KhaataEntry = {
      id: Date.now().toString(),
      customerName: newCustomer.customerName,
      phone: newCustomer.phone || '98XXXXXXXX',
      amount: Number(newCustomer.amount),
      description: newCustomer.description || 'General items credit',
      date: new Date().toISOString().split('T')[0],
      dueDate: newCustomer.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'PENDING',
    };

    setEntries([entry, ...entries]);
    setNewCustomer({ customerName: '', phone: '', amount: '', description: '', dueDate: '' });
    setShowAddModal(false);
  };

  const handleToggleStatus = (id: string) => {
    setEntries(
      entries.map((e) =>
        e.id === id ? { ...e, status: e.status === 'PENDING' ? 'SETTLED' : 'PENDING' } : e
      )
    );
  };

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.includes(searchQuery) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'PENDING') return matchesSearch && e.status === 'PENDING';
    if (filterStatus === 'SETTLED') return matchesSearch && e.status === 'SETTLED';
    return matchesSearch;
  });

  const totalPendingReceivables = entries
    .filter((e) => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);

  const khaataSteps = [
    { title: 'Log Customer Udhar', description: 'Record customer name, phone number, and grocery/goods credit amount.' },
    { title: 'Track Due Dates', description: 'We track upcoming payment deadlines and highlight overdue balances.' },
    { title: 'Factor into Cash Runway', description: 'Expected customer repayments automatically extend your cash runway.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Customer Khaata & Udhar Ledger</span>
              <Tooltip text="Track customer credit balances (Udhar), set due dates, and monitor pending payments to boost cash flow." />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Keep your customer credit accounts organized and secure your daily cash collections.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowAddModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add New Credit Entry
          </Button>
        </div>

        {/* How Khaata Works Accordion */}
        <HowItWorksModal title="Customer Credit Management" steps={khaataSteps} />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Pending Receivables
            </span>
            <div className="text-3xl font-black text-amber-600">
              ₹{totalPendingReceivables.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Expected incoming cash from {entries.filter((e) => e.status === 'PENDING').length} customers
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Settled This Month
            </span>
            <div className="text-3xl font-black text-emerald-700">
              ₹{entries.filter((e) => e.status === 'SETTLED').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% recovered on time
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block mb-1">
              AI Runway Impact
            </span>
            <div className="text-sm font-semibold text-slate-800">
              Recovering pending balances adds <span className="font-extrabold text-indigo-700">+4 Days</span> to your cash runway buffer.
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, phone, or item..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending ({entries.filter((e) => e.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilterStatus('SETTLED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'SETTLED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Settled ({entries.filter((e) => e.status === 'SETTLED').length})
            </button>
          </div>
        </div>

        {/* Khaata Entries Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Particulars / Items</th>
                  <th className="py-3.5 px-4 font-semibold">Credit Date</th>
                  <th className="py-3.5 px-4 font-semibold">Due Date</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Amount</th>
                  <th className="py-3.5 px-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{entry.customerName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {entry.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{entry.description}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{entry.date}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className={entry.status === 'PENDING' ? 'text-amber-800 font-bold' : 'text-slate-400'}>
                        {entry.dueDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {entry.status === 'PENDING' ? (
                        <Badge variant="warning" size="sm" icon="warning">
                          Pending Payment
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm" icon="check">
                          Settled
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-xs text-slate-900">
                      ₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(entry.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          entry.status === 'PENDING'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {entry.status === 'PENDING' ? 'Mark Paid ✓' : 'Mark Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Entry Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>New Customer Credit Entry</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.customerName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      placeholder="e.g. 9845012345"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Credit Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newCustomer.amount}
                      onChange={(e) => setNewCustomer({ ...newCustomer, amount: e.target.value })}
                      placeholder="e.g. 2500"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Items / Description</label>
                  <input
                    type="text"
                    value={newCustomer.description}
                    onChange={(e) => setNewCustomer({ ...newCustomer, description: e.target.value })}
                    placeholder="e.g. 1 Bag Rice, Cooking Oil, Spices"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Payment Due Date</label>
                  <input
                    type="date"
                    value={newCustomer.dueDate}
                    onChange={(e) => setNewCustomer({ ...newCustomer, dueDate: e.target.value })}
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
                  <Button variant="primary" size="sm" type="submit">
                    Save Credit Entry
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
