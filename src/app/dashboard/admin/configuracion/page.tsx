'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Loader2 } from 'lucide-react';

export default function ConfiguracionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración del Sistema</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Ajustes generales y configuración avanzada
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
        <Settings className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Configuración
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Esta sección está en desarrollo
        </p>
      </div>
    </div>
  );
}
