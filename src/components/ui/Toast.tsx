'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-500 dark:border-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-500 dark:border-red-400',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-900 dark:text-red-100',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-500 dark:border-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-900 dark:text-amber-100',
  },
  info: {
    icon: Info,
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-500 dark:border-cyan-400',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    titleColor: 'text-cyan-900 dark:text-cyan-100',
  },
};

export default function Toast({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  duration = 5000,
}: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideInRight">
      <div
        className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg shadow-lg p-4 max-w-md min-w-[320px]`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <Icon className={`${config.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
          
          <div className="flex-1 min-w-0">
            <h3 className={`${config.titleColor} font-semibold text-sm mb-1`}>
              {title}
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors flex-shrink-0"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
