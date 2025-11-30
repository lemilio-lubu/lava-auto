'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Car as CarIcon, User, Star, Clock, DollarSign, FileText, Loader2 } from 'lucide-react';

interface ReservationDetailsModalProps {
  reservationId: string;
  onClose: () => void;
}

export default function ReservationDetailsModal({
  reservationId,
  onClose,
}: ReservationDetailsModalProps) {
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await fetch(`/api/reservations/${reservationId}`);
        if (!response.ok) {
          throw new Error('Error al cargar la reserva');
        }
        const data = await response.json();
        setReservation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId]);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    CONFIRMED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Detalles de la Reserva
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : reservation ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    statusColors[reservation.status]
                  }`}
                >
                  {statusLabels[reservation.status]}
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  ${reservation.totalAmount.toFixed(0)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha y Hora
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {new Date(reservation.scheduledDate).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {reservation.scheduledTime}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duración Estimada
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {reservation.service.duration} minutos
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Servicio
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">
                    {reservation.service.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {reservation.service.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <CarIcon className="w-5 h-5" />
                  Vehículo
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Placas: {reservation.vehicle.plate}
                  </p>
                  {reservation.vehicle.color && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Color: {reservation.vehicle.color}
                    </p>
                  )}
                </div>
              </div>

              {reservation.address && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Ubicación del Servicio
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-900 dark:text-white">{reservation.address}</p>
                    {reservation.latitude && reservation.longitude && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        Coordenadas: {reservation.latitude.toFixed(6)}, {reservation.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {reservation.washer && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Lavador Asignado
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {reservation.washer.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {reservation.washer.email}
                    </p>
                    {reservation.washer.phone && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Tel: {reservation.washer.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {reservation.notes && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                    Notas Adicionales
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-slate-900 dark:text-white">{reservation.notes}</p>
                  </div>
                </div>
              )}

              {reservation.rating && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Calificación
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < reservation.rating.stars
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                      <span className="font-semibold text-slate-900 dark:text-white ml-2">
                        {reservation.rating.stars}/5
                      </span>
                    </div>
                    {reservation.rating.comment && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {reservation.rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 p-6">
          <button
            onClick={onClose}
            className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
