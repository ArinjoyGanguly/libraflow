import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60',
    warning: 'bg-amber-950/70 text-amber-300 border border-amber-800/60',
    danger: 'bg-rose-950/70 text-rose-300 border border-rose-800/60',
    info: 'bg-sky-950/70 text-sky-300 border border-sky-800/60',
    purple: 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60',
    outline: 'bg-transparent text-slate-400 border border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-mono uppercase tracking-wider transition-colors ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
