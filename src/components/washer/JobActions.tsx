'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { jobApi, reservationApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface JobActionsProps {
  jobId: string;
  status: string;
}

export default function JobActions({ jobId, status }: JobActionsProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleStartJob = async () => {
    setIsLoading(true);

    try {
      if (!token) throw new Error('No token');
      
      await jobApi.start(jobId, token);

      setToast({
        isOpen: true,
        title: 'Trabajo iniciado',
        message: 'El cliente ha sido notificado que estás en camino',
        type: 'success',
      });

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo iniciar el trabajo. Intenta nuevamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    setIsLoading(true);

    try {
      if (!token) throw new Error('No token');
      
      await jobApi.complete(jobId, [], token);

      setToast({
        isOpen: true,
        title: 'Trabajo completado',
        message: '¡Excelente! El trabajo ha sido marcado como completado',
        type: 'success',
      });

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo completar el trabajo. Intenta nuevamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectJob = async () => {
    if (!confirm('¿Estás seguro de que deseas rechazar este trabajo?')) {
      return;
    }

    setIsLoading(true);

    try {
      if (!token) throw new Error('No token');
      
      // Usar el método de cancelar reservación
      await reservationApi.cancel(jobId, token);

      setToast({
        isOpen: true,
        title: 'Trabajo rechazado',
        message: 'El trabajo ha sido cancelado',
        type: 'warning',
      });

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo rechazar el trabajo. Intenta nuevamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {status === 'CONFIRMED' && (
          <button
            onClick={handleStartJob}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            {isLoading ? 'Iniciando...' : 'Iniciar Trabajo'}
          </button>
        )}
        {status === 'IN_PROGRESS' && (
          <button
            onClick={handleCompleteJob}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            {isLoading ? 'Completando...' : 'Completar'}
          </button>
        )}
        {(status === 'PENDING' || status === 'CONFIRMED') && (
          <button
            onClick={handleRejectJob}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold px-6 py-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-5 h-5" />
            {isLoading ? 'Rechazando...' : 'Rechazar'}
          </button>
        )}
      </div>

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
}
