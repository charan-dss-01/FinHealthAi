import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'subtle';
  hoverEffect?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'default',
  hoverEffect = false,
  children,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-white border border-slate-200/80 shadow-sm',
    elevated: 'bg-white border border-slate-200/60 shadow-md',
    glass: 'bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-sm',
    subtle: 'bg-slate-50/80 border border-slate-200/50',
  };

  const hoverStyles = hoverEffect ? 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 pb-3 border-b border-slate-100 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 pt-3 border-t border-slate-100 ${className}`}>{children}</div>;
}
