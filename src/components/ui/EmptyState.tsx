import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionHref,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && (
        actionHref ? (
          <a
            href={actionHref}
            className="inline-flex items-center justify-center text-sm px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all"
          >
            {actionText}
          </a>
        ) : (
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        )
      )}
    </div>
  );
}
