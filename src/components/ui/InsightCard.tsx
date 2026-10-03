import React from 'react';
import Link from 'next/link';
import { Card } from './Card';
import { Badge, BadgeVariant } from './Badge';
import { Bot, ArrowRight } from 'lucide-react';

interface InsightCardProps {
  id?: string;
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'POSITIVE' | string;
  actionText?: string;
  actionHref?: string;
  className?: string;
}

export function InsightCard({
  title,
  description,
  severity,
  actionText = 'Ask Assistant About This Alert',
  actionHref,
  className = '',
}: InsightCardProps) {
  const getBadgeConfig = (): { label: string; variant: BadgeVariant; icon: 'alert' | 'warning' | 'check' | 'info' } => {
    switch (severity) {
      case 'HIGH':
        return { label: 'Needs Attention', variant: 'critical', icon: 'alert' };
      case 'MEDIUM':
        return { label: 'Watch Closely', variant: 'warning', icon: 'warning' };
      case 'POSITIVE':
        return { label: 'Good Opportunity', variant: 'success', icon: 'check' };
      default:
        return { label: 'Insight', variant: 'indigo', icon: 'info' };
    }
  };

  const badge = getBadgeConfig();
  const queryText = `What should I do about this alert: ${title}? ${description}`;
  const targetHref = actionHref || `/copilot?q=${encodeURIComponent(queryText)}`;

  return (
    <Card
      variant="default"
      hoverEffect
      className={`p-5 flex flex-col justify-between space-y-4 border-l-4 ${
        severity === 'HIGH'
          ? 'border-l-rose-500'
          : severity === 'MEDIUM'
          ? 'border-l-amber-500'
          : 'border-l-emerald-500'
      } ${className}`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={badge.variant} icon={badge.icon}>
            {badge.label}
          </Badge>
        </div>

        <h4 className="text-sm font-bold text-slate-900 leading-snug">{title}</h4>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">Recommended Action</span>
        <Link
          href={targetHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>{actionText}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
}
