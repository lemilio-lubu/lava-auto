'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
      aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
      ) : (
        <Sun className="w-5 h-5 text-slate-200" />
      )}
    </button>
  );
}
