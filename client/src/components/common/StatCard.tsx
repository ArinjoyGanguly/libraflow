import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  trend,
  trendPositive,
  colorScheme = 'indigo',
  onClick,
}) => {
  const colorMap = {
    indigo: {
      border: 'hover:border-indigo-500/50',
      iconBg: 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/60',
      accent: 'text-indigo-400',
    },
    emerald: {
      border: 'hover:border-emerald-500/50',
      iconBg: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
      accent: 'text-emerald-400',
    },
    amber: {
      border: 'hover:border-amber-500/50',
      iconBg: 'bg-amber-950/60 text-amber-400 border border-amber-800/60',
      accent: 'text-amber-400',
    },
    rose: {
      border: 'hover:border-rose-500/50',
      iconBg: 'bg-rose-950/60 text-rose-400 border border-rose-800/60',
      accent: 'text-rose-400',
    },
    sky: {
      border: 'hover:border-sky-500/50',
      iconBg: 'bg-sky-950/60 text-sky-400 border border-sky-800/60',
      accent: 'text-sky-400',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md transition-all duration-200 ${
        scheme.border
      } ${onClick ? 'cursor-pointer hover:translate-y-[-2px]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${scheme.iconBg}`}>{icon}</div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-bold font-mono tracking-tight text-white">{value}</div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trendPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
