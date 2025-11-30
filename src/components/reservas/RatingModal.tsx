'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, X } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface RatingModalProps {
  reservationId: string;
  onClose: () => void;
}

export default function RatingModal({ reservationId, onClose }: RatingModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      setToast({
        isOpen: true,
        title: 'Calificación requerida',
        message: 'Por favor selecciona una calificación de 1 a 5 estrellas',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/reservations/${reservationId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stars: rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar calificación');
      }

      setToast({
        isOpen: true,
        title: '¡Gracias por tu calificación!',
        message: 'Tu opinión nos ayuda a mejorar el servicio',
        type: 'success',
      });

      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1500);
    } catch (error) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo enviar tu calificación. Intenta nuevamente.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Calificar Servicio
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div>
              <p className="text-center text-slate-700 dark:text-slate-300 mb-4">
                ¿Cómo fue tu experiencia con el servicio?
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isSubmitting}
                    className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {rating === 1 && 'Muy malo'}
                  {rating === 2 && 'Malo'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Bueno'}
                  {rating === 5 && '¡Excelente!'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Cuéntanos más sobre tu experiencia..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white resize-none disabled:opacity-50"
                maxLength={500}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                {comment.length}/500 caracteres
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </div>
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
