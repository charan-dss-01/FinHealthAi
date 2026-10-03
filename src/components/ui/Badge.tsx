import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'critical' | 'info' | 'neutral' | 'indigo';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: 'check' | 'warning' | 'alert' | 'info' | 'dot' | 'none';
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon = 'dot',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold',
    critical: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-rose-500',
    info: 'bg-blue-500',
    indigo: 'bg-indigo-600',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon === 'dot' && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {icon === 'check' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
      {icon === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
      {icon === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
      {icon === 'info' && <Info className="w-3.5 h-3.5 text-blue-600" />}
      <span>{children}</span>
    </span>
  );
}
