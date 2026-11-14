'use client';

import React, { useState, useEffect } from 'react';
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
  Mail,
  MessageSquare,
  IndianRupee,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Trash2,
  Bell,
  Settings,
  History,
  Send,
  RefreshCw,
  X,
  Check
} from 'lucide-react';

interface KhaataEntry {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string | null;
  amount: number;
  description: string;
  dueDate: string | null;
  status: 'PENDING' | 'SETTLED';
  createdAt?: string;
}

interface CustomerData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  whatsappConsent: boolean;
  emailConsent: boolean;
  remindersEnabled: boolean;
  preferredLanguage: string;
}

interface NotificationLogItem {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  status: string;
  providerId?: string | null;
  failureReason?: string | null;
  createdAt: string;
  customer?: { name: string; phone?: string; email?: string };
}

interface KhaataSummary {
  totalReceivables: number;
  pendingCount: number;
  settledCount: number;
  overdueCount: number;
  overdueAmount: number;
}

export default function KhaataPage() {
  const [entries, setEntries] = useState<KhaataEntry[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [summary, setSummary] = useState<KhaataSummary>({
    totalReceivables: 0,
    pendingCount: 0,
    settledCount: 0,
    overdueCount: 0,
    overdueAmount: 0,
  });
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'SETTLED'>('ALL');
  const [activeTab, setActiveTab] = useState<'entries' | 'history'>('entries');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [runningScheduler, setRunningScheduler] = useState(false);
  const [schedulerNotice, setSchedulerNotice] = useState<string | null>(null);

  // New entry form state
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    phone: '',
    email: '',
    amount: '',
    description: '',
    dueDate: '',
    whatsappConsent: false,
    emailConsent: false,
    remindersEnabled: false,
    preferredLanguage: 'en',
  });

  const loadKhaataData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/khaata');
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
        if (data.customers) setCustomers(data.customers);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching Khaata:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch('/api/notifications?limit=30');
      const data = await res.json();
      if (data.success) {
        setNotificationLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadKhaataData();
    loadNotificationLogs();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.customerName || !newCustomer.amount || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/khaata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      const data = await res.json();
      if (data.success) {
        setNewCustomer({
          customerName: '',
          phone: '',
          email: '',
          amount: '',
          description: '',
          dueDate: '',
          whatsappConsent: false,
          emailConsent: false,
          remindersEnabled: false,
          preferredLanguage: 'en',
        });
        setShowAddModal(false);
        await loadKhaataData();
        await loadNotificationLogs();
      } else {
        alert(data.error || 'Failed to add Khaata entry');
      }
    } catch (err) {
      console.error('Error adding Khaata entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PENDING' ? 'SETTLED' : 'PENDING';
    try {
      const res = await fetch('/api/khaata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await loadKhaataData();
        await loadNotificationLogs();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credit entry?')) return;
    try {
      const res = await fetch(`/api/khaata?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await loadKhaataData();
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedCustomer),
      });
      const data = await res.json();
      if (data.success) {
        setShowPreferencesModal(false);
        await loadKhaataData();
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
    }
  };

  const handleRunScheduler = async () => {
    setRunningScheduler(true);
    setSchedulerNotice(null);
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const r = data.result;
        setSchedulerNotice(
          `Inspected ${r.inspectedEntries} entries: ${r.dueSoonTriggered} due tomorrow, ${r.dueTodayTriggered} due today, ${r.overdue1Triggered + r.overdue2Triggered} overdue.`
        );
        await loadNotificationLogs();
      } else {
        setSchedulerNotice('Scheduler executed with error: ' + (data.error || 'Failed'));
      }
    } catch (err: any) {
      setSchedulerNotice('Failed to run scheduler: ' + err.message);
    } finally {
      setRunningScheduler(false);
    }
  };

  const openCustomerPreferences = (customerId?: string, customerName?: string) => {
    const cust = customers.find((c) => c.id === customerId || c.name === customerName);
    if (cust) {
      setSelectedCustomer(cust);
      setShowPreferencesModal(true);
    }
  };

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.phone || '').includes(searchQuery) ||
      (e.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'PENDING') return matchesSearch && e.status === 'PENDING';
    if (filterStatus === 'SETTLED') return matchesSearch && e.status === 'SETTLED';
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'SENT':
        return <Badge variant="indigo" size="sm">{status}</Badge>;
      case 'DELIVERED':
        return <Badge variant="success" size="sm">{status}</Badge>;
      case 'FAILED':
        return <Badge variant="critical" size="sm">FAILED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="warning" size="sm">{status}</Badge>;
    }
  };

  const khaataSteps = [
    { title: 'Log Customer Udhar', description: 'Record customer name, phone, optional email, and credit items.' },
    { title: 'Automatic WhatsApp & Email', description: 'Real-time updates sent to customer upon new credit or recorded payment.' },
    { title: 'Smart Due Reminders', description: 'Automated 1-day before, due date, and overdue payment alerts sent respectfully.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Customer Khaata & Ledger</span>
              <Tooltip text="Track customer credit balances (Udhar), automated WhatsApp/Email receipts, and scheduled payment reminders." />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track customer credit (Udhar), record payments, and send automatic payment reminders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunScheduler}
              disabled={runningScheduler}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
              title="Inspect due dates and send scheduled payment reminders"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${runningScheduler ? 'animate-spin' : ''}`} />
              <span>{runningScheduler ? 'Inspecting...' : 'Run Reminder Cycle'}</span>
            </button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add New Credit Entry
            </Button>
          </div>
        </div>

        {schedulerNotice && (
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>{schedulerNotice}</span>
            </div>
            <button onClick={() => setSchedulerNotice(null)} className="text-indigo-400 hover:text-indigo-700">✕</button>
          </div>
        )}

        {/* How Khaata Works Accordion */}
        <HowItWorksModal title="Customer Credit Management & Automated Notifications" steps={khaataSteps} />

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Pending Receivables
            </span>
            <div className="text-3xl font-black text-amber-600">
              ₹{summary.totalReceivables.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Expected incoming cash from {summary.pendingCount} customers
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Settled Accounts
            </span>
            <div className="text-3xl font-black text-emerald-700">
              {summary.settledCount} Settled
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Recovered with receipts
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Overdue Receivables
            </span>
            <div className={`text-3xl font-black ${summary.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              ₹{summary.overdueAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              {summary.overdueCount > 0 ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-600 font-semibold">{summary.overdueCount} accounts past due date</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">All accounts on schedule</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'entries'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ledger Entries ({entries.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              loadNotificationLogs();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Notification History ({notificationLogs.length})</span>
          </button>
        </div>

        {activeTab === 'entries' ? (
          <>
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
                  Pending ({summary.pendingCount})
                </button>
                <button
                  onClick={() => setFilterStatus('SETTLED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterStatus === 'SETTLED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Settled ({summary.settledCount})
                </button>
              </div>
            </div>

            {/* Khaata Entries Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading ledger records from database...</span>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No ledger entries match your search criteria.
                </div>
              ) : (
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
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{entry.customerName}</span>
                              <button
                                onClick={() => openCustomerPreferences(entry.customerId, entry.customerName)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                                title="Edit Customer Notification Preferences"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                            </div>
                            {entry.phone && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" /> {entry.phone}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{entry.description}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {entry.createdAt
                              ? new Date(entry.createdAt).toLocaleDateString('en-IN')
                              : 'Recent'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <span className={entry.status === 'PENDING' ? 'text-amber-800 font-bold' : 'text-slate-400'}>
                              {entry.dueDate ? new Date(entry.dueDate).toLocaleDateString('en-IN') : 'No due date'}
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
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleStatus(entry.id, entry.status)}
                                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                  entry.status === 'PENDING'
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                              >
                                {entry.status === 'PENDING' ? 'Mark Paid ✓' : 'Mark Pending'}
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Notification History Tab */
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Customer Notification Audit Trail</h3>
                <p className="text-[11px] text-slate-500">
                  Real-time delivery status for customer WhatsApp and Email notifications.
                </p>
              </div>
              <button
                onClick={loadNotificationLogs}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {logsLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading delivery logs...</span>
              </div>
            ) : notificationLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No notification logs recorded yet. Create a credit entry or record a payment to see automated triggers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Date & Time</th>
                      <th className="py-3 px-4 font-semibold">Recipient</th>
                      <th className="py-3 px-4 font-semibold">Notification Type</th>
                      <th className="py-3 px-4 font-semibold">Channel</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Provider ID / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {notificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{log.customer?.name || 'Customer'}</div>
                          <div className="text-[11px] text-slate-400">{log.recipient}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {log.type.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4">
                          {log.channel === 'WHATSAPP' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                              <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                          {log.failureReason ? (
                            <span className="text-rose-600 font-semibold" title={log.failureReason}>
                              {log.failureReason}
                            </span>
                          ) : (
                            log.providerId || 'Provider processing'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Entry Modal with Customer Notification Consent Checkboxes */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (WhatsApp)</label>
                    <input
                      type="text"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      placeholder="e.g. 9845012345"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      placeholder="e.g. customer@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expected Payment Due Date</label>
                    <input
                      type="date"
                      value={newCustomer.dueDate}
                      onChange={(e) => setNewCustomer({ ...newCustomer, dueDate: e.target.value })}
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

                {/* Notification Preferences & Consent Section (Unchecked by default) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 mt-2">
                  <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Customer Notification Preferences & Consent
                  </span>

                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCustomer.whatsappConsent}
                      onChange={(e) => setNewCustomer({ ...newCustomer, whatsappConsent: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold">WhatsApp notifications consent</span>
                      <p className="text-[10px] text-slate-500">Send instant WhatsApp credit receipt & updates</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCustomer.emailConsent}
                      onChange={(e) => setNewCustomer({ ...newCustomer, emailConsent: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold">Email notifications consent</span>
                      <p className="text-[10px] text-slate-500">Send HTML receipt & payment confirmation to email</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCustomer.remindersEnabled}
                      onChange={(e) => setNewCustomer({ ...newCustomer, remindersEnabled: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold">Automatic due-date reminders</span>
                      <p className="text-[10px] text-slate-500">Allow automatic reminder 1 day before, on due date, and overdue</p>
                    </div>
                  </label>

                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Reminder Language</label>
                    <select
                      value={newCustomer.preferredLanguage}
                      onChange={(e) => setNewCustomer({ ...newCustomer, preferredLanguage: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                    </select>
                  </div>
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
                    {submitting ? 'Saving...' : 'Save Credit Entry'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Preferences Modal */}
        {showPreferencesModal && selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <span>Preferences for {selectedCustomer.name}</span>
                </h3>
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePreferences} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (E.164)</label>
                  <input
                    type="text"
                    value={selectedCustomer.phone || ''}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={selectedCustomer.email || ''}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Consent & Channels
                  </span>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                    <span className="font-bold">WhatsApp Notifications</span>
                    <input
                      type="checkbox"
                      checked={selectedCustomer.whatsappConsent}
                      onChange={(e) => setSelectedCustomer({ ...selectedCustomer, whatsappConsent: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                    <span className="font-bold">Email Notifications</span>
                    <input
                      type="checkbox"
                      checked={selectedCustomer.emailConsent}
                      onChange={(e) => setSelectedCustomer({ ...selectedCustomer, emailConsent: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                    <span className="font-bold">Automatic Due Reminders</span>
                    <input
                      type="checkbox"
                      checked={selectedCustomer.remindersEnabled}
                      onChange={(e) => setSelectedCustomer({ ...selectedCustomer, remindersEnabled: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Preferred Reminder Language</label>
                    <select
                      value={selectedCustomer.preferredLanguage}
                      onChange={(e) => setSelectedCustomer({ ...selectedCustomer, preferredLanguage: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPreferencesModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <Button variant="primary" size="sm" type="submit">
                    Save Changes
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
