'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';

interface CancelReservationButtonProps {
  reservationId: string;
  status: string;
}

export default function CancelReservationButton({
  reservationId,
  status,
}: CancelReservationButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');

  if (status !== 'PENDING' && status !== 'CONFIRMED') {
    return null;
  }

  const handleCancel = async () => {
    setIsCancelling(true);
    setError('');

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar la reserva');
      }

      router.refresh();
      setIsConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
      setIsCancelling(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsConfirming(true)}
        className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800"
      >
        Cancelar
      </button>

      {isConfirming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Cancelar Reserva
              </h3>
              <button
                onClick={() => setIsConfirming(false)}
                disabled={isCancelling}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <p className="text-slate-600 dark:text-slate-400 mb-6">
              ¿Estás seguro que deseas cancelar esta reserva? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirming(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  'Sí, cancelar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
