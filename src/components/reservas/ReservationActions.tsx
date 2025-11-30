'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import CancelReservationButton from './CancelReservationButton';
import ReservationDetailsModal from './ReservationDetailsModal';
import RatingModal from './RatingModal';

interface ReservationActionsProps {
  reservationId: string;
  status: string;
  hasRating: boolean;
  isPaid?: boolean;
}

export default function ReservationActions({
  reservationId,
  status,
  hasRating,
  isPaid = false,
}: ReservationActionsProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const handlePayment = () => {
    router.push(`/dashboard/pagos/${reservationId}`);
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setShowDetails(true)}
          className="px-4 py-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors border border-cyan-200 dark:border-cyan-800"
        >
          Ver Detalles
        </button>
        
        {status === 'COMPLETED' && !isPaid && (
          <button
            onClick={handlePayment}
            className="px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Pagar
          </button>
        )}
        
        {status === 'COMPLETED' && !hasRating && (
          <button
            onClick={() => setShowRatingModal(true)}
            className="px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors border border-amber-200 dark:border-amber-800"
          >
            Calificar
          </button>
        )}
        
        <CancelReservationButton reservationId={reservationId} status={status} />
      </div>

      {showDetails && (
        <ReservationDetailsModal
          reservationId={reservationId}
          onClose={() => setShowDetails(false)}
        />
      )}

      {showRatingModal && (
        <RatingModal
          reservationId={reservationId}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </>
  );
}
