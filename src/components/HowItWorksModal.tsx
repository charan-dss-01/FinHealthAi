'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface Step {
  title: string;
  description: string;
}

interface HowItWorksModalProps {
  title: string;
  steps: Step[];
}

export default function HowItWorksModal({ title, steps }: HowItWorksModalProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <span>How {title} works (3-Step Simple Guide)</span>
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/70 p-4 rounded-xl space-y-1.5 shadow-xs relative hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[11px]">
                    Step {idx + 1}
                  </span>
                  {idx < steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-xs pt-1">{step.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
