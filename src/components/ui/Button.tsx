import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg dark:bg-cyan-500 dark:hover:bg-cyan-600',
  secondary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-700',
  outline: 'border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-slate-800',
  ghost: 'text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-slate-800',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg dark:bg-red-600 dark:hover:bg-red-700',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
