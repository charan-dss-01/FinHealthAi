import React from 'react';
import { Card } from './Card';
import Tooltip from '../Tooltip';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'positive' | 'warning' | 'critical' | 'indigo';
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  tooltip,
  trend,
  icon,
  variant = 'default',
  onClick,
  className = '',
}: MetricCardProps) {
  const iconColors = {
    default: 'bg-slate-100 text-slate-700',
    positive: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    critical: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <Card
      variant="default"
      hoverEffect={!!onClick}
      onClick={onClick}
      className={`p-5 flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>{title}</span>
          {tooltip && <Tooltip text={tooltip} />}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColors[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium">
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
            {trend.label && <span className="text-slate-400">{trend.label}</span>}
          </div>
        )}

        {subtitle && !trend && (
          <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
