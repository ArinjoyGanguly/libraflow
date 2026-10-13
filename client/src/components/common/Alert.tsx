import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const styles: Record<
    AlertType,
    { border: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    info: {
      border: 'border-sky-800/60',
      bg: 'bg-sky-950/40',
      text: 'text-sky-200',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    },
    success: {
      border: 'border-emerald-800/60',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    warning: {
      border: 'border-amber-800/60',
      bg: 'bg-amber-950/40',
      text: 'text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    error: {
      border: 'border-rose-800/60',
      bg: 'bg-rose-950/40',
      text: 'text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${current.border} ${current.bg} ${current.text} ${className}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1 text-xs">
        {title && <h5 className="font-semibold text-sm mb-0.5">{title}</h5>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 transition-colors p-0.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
