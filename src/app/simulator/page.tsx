'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HowItWorksModal from '@/components/HowItWorksModal';
import Tooltip from '@/components/Tooltip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { Sparkles, Sliders, TrendingUp, TrendingDown, Users, ShieldAlert, ArrowRight, Bot } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SimulatorPage() {
  const [revenueChangePct, setRevenueChangePct] = useState(0);
  const [expenseChangePct, setExpenseChangePct] = useState(0);
  const [newStaffCost, setNewStaffCost] = useState(0);
  const [eliminatePersonal, setEliminatePersonal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<any | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revenueChangePct,
          expenseChangePct,
          newMonthlyStaffCost: newStaffCost,
          eliminatePersonalSpend: eliminatePersonal,
        }),
      });
      const data = await res.json();
      if (data.simulation) {
        setSimulation(data.simulation);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [revenueChangePct, expenseChangePct, newStaffCost, eliminatePersonal]);

  const simulatorSteps = [
    { title: 'Choose Your Scenario', description: 'Adjust sliders to test sales growth, hiring staff, or supplier cost increases.' },
    { title: 'Calculate Future Impact', description: 'We model how your daily money balance will change over the next 90 days.' },
    { title: 'Get Clear CFO Verdict', description: 'We tell you whether the decision is safe or if it risks your cash reserves.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Test a Business Decision</span>
              <Tooltip text="Test potential future decisions (hiring staff, sales drops, price rises) before spending actual cash." />
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              See how hiring staff, sales drops, or cost inflation affect your money duration before taking risks.
            </p>
          </div>
        </div>

        {/* How Testing a Decision Works Accordion */}
        <HowItWorksModal title="Scenario Simulation" steps={simulatorSteps} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls Panel */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" /> Decision Sliders
            </h2>

            {/* Slider 1: Sales Change */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">What if monthly sales change?</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  revenueChangePct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {revenueChangePct > 0 ? `+${revenueChangePct}%` : `${revenueChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="5"
                value={revenueChangePct}
                onChange={(e) => setRevenueChangePct(Number(e.target.value))}
                className="w-full accent-indigo-600 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>-40% (Drop)</span>
                <span>0% (Steady)</span>
                <span>+40% (Growth)</span>
              </div>
            </div>

            {/* Slider 2: Supplier Inflation */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">What if supplier costs change?</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  expenseChangePct <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  {expenseChangePct > 0 ? `+${expenseChangePct}%` : `${expenseChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="30"
                step="5"
                value={expenseChangePct}
                onChange={(e) => setExpenseChangePct(Number(e.target.value))}
                className="w-full accent-amber-600 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>-20% (Cut)</span>
                <span>0% (Steady)</span>
                <span>+30% (Rise)</span>
              </div>
            </div>

            {/* Slider 3: New Staff Salary */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">What if I hire a new staff helper?</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700">
                  ₹{newStaffCost.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="2500"
                value={newStaffCost}
                onChange={(e) => setNewStaffCost(Number(e.target.value))}
                className="w-full accent-indigo-600 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>₹0</span>
                <span>₹25,000</span>
                <span>₹50,000</span>
              </div>
            </div>

            {/* Toggle: Personal Spend Removal */}
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="pr-2">
                  <span className="text-xs font-semibold text-slate-800 block group-hover:text-indigo-600 transition-colors">
                    Stop Personal Spends
                  </span>
                  <span className="text-[11px] text-slate-500">Stop Swiggy/Netflix from store account</span>
                </div>
                <input
                  type="checkbox"
                  checked={eliminatePersonal}
                  onChange={(e) => setEliminatePersonal(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Right Projection & Verdict Panel */}
          <div className="lg:col-span-8 space-y-6">
            {simulation && (
              <>
                {/* Metric Delta Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Simulated Health</span>
                    <div className="mt-1 flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-slate-900">{simulation.simulated.healthScore}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        simulation.deltas.healthScoreDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {simulation.deltas.healthScoreDelta >= 0 ? '+' : ''}
                      {simulation.deltas.healthScoreDelta} vs Current ({simulation.baseline.healthScore})
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Money Duration</span>
                    <div className="mt-1 text-3xl font-black text-slate-900">{simulation.simulated.runwayDays} Days</div>
                    <p
                      className={`text-xs font-semibold ${
                        simulation.deltas.runwayDaysDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {simulation.deltas.runwayDaysDelta >= 0 ? '+' : ''}
                      {simulation.deltas.runwayDaysDelta} Days vs Current ({simulation.baseline.runwayDays} Days)
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Expected 90-Day Cash</span>
                    <div className="mt-1 text-2xl font-black text-slate-900">
                      ₹{(simulation.simulated.ending90DayBalance / 100000).toFixed(2)} Lakhs
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        simulation.deltas.balanceDelta90Days >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {simulation.deltas.balanceDelta90Days >= 0 ? '+' : ''}₹
                      {(simulation.deltas.balanceDelta90Days / 100000).toFixed(2)}L Impact
                    </p>
                  </div>
                </div>

                {/* Assistant Verdict Callout */}
                <div className="bg-indigo-50/80 border border-indigo-200/80 p-5 rounded-2xl flex items-start gap-3.5 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">AI Assistant Verdict</h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">{simulation.cfoVerdict}</p>
                  </div>
                </div>

                {/* Recharts 90-Day Cash Trajectory Line Chart */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Will I have enough money for the next 90 days?
                      </h3>
                      <p className="text-xs text-slate-400">Comparing current path vs. your tested scenario</p>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={simulation.simulatedProjections} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                          formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Cash Balance']}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Line
                          type="monotone"
                          dataKey="baselineBalance"
                          name="Current Path"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="simulatedBalance"
                          name="Tested Scenario"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
