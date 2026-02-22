'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Página principal del dashboard
 * Redirige automáticamente según el rol del usuario:
 * - CLIENT → /dashboard/client (solicitar lavados, ver sus reservas)
 * - WASHER → /dashboard/washer (ver trabajos asignados, gestionar servicios)
 * - ADMIN → /dashboard/admin (administrar todo el sistema)
 */
export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Redirigir según el rol del usuario
    switch (user.role) {
      case 'CLIENT':
        router.push('/dashboard/client');
        break;
      case 'WASHER':
        router.push('/dashboard/washer');
        break;
      case 'ADMIN':
        router.push('/dashboard/admin');
        break;
      default:
        router.push('/login');
    }
  }, [user, isLoading, isAuthenticated, router]);

  // Mostrar loading mientras se redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
      </div>
    </div>
  );
}
