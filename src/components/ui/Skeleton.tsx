import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rounded' | 'card';
}

export function Skeleton({ className = '', variant = 'text', ...props }: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    card: 'h-40 w-full rounded-2xl',
  };

  return (
    <div
      className={`skeleton bg-slate-200/80 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 h-72 shadow-sm" />
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 h-32 shadow-sm" />
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 h-32 shadow-sm" />
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 h-32 shadow-sm" />
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 h-32 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
