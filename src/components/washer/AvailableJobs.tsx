'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Car, Clock, DollarSign, CheckCircle } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface AvailableJob {
  id: string;
  scheduledDate: Date;
  scheduledTime: string;
  totalAmount: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  service: {
    name: string;
    duration: number;
  };
  vehicle: {
    brand: string;
    model: string;
    plate: string;
  };
  user: {
    name: string;
    phone: string | null;
    address: string | null;
  };
}

interface AvailableJobsProps {
  jobs: AvailableJob[];
}

export default function AvailableJobs({ jobs }: AvailableJobsProps) {
  const router = useRouter();
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleAcceptJob = async (jobId: string) => {
    setAcceptingJobId(jobId);

    try {
      const res = await fetch('/api/jobs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: jobId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al aceptar el trabajo');
      }

      setToast({
        isOpen: true,
        title: '¡Trabajo Aceptado!',
        message: 'El trabajo ha sido asignado a ti. Ahora aparece en tus trabajos.',
        type: 'success',
      });

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error al aceptar trabajo:', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo aceptar el trabajo',
        type: 'error',
      });
      setAcceptingJobId(null);
    }
  };

  const formatDate = (date: Date) => {
    const jobDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (jobDate.toDateString() === today.toDateString()) {
      return '🔥 HOY';
    } else if (jobDate.toDateString() === tomorrow.toDateString()) {
      return '📅 MAÑANA';
    } else {
      return jobDate.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          No hay trabajos disponibles en este momento
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
          Los nuevos pedidos aparecerán aquí automáticamente
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {jobs.map((job) => {
          const isAccepting = acceptingJobId === job.id;
          
          return (
            <div
              key={job.id}
              className="border-2 border-amber-200 dark:border-amber-800 rounded-xl p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">
                      🆕 NUEVO PEDIDO
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-bold">
                      {formatDate(job.scheduledDate)}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      a las {job.scheduledTime}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {job.service.name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Vehículo</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {job.vehicle.brand} {job.vehicle.model}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{job.vehicle.plate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Cliente</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{job.user.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{job.user.phone || 'Sin teléfono'}</p>
                      </div>
                    </div>
                  </div>

                  {job.address && (
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-500 font-semibold">Ubicación del Servicio</p>
                        <p className="text-sm font-medium">{job.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="w-6 h-6" />
                      <p className="text-3xl font-bold">{job.totalAmount.toFixed(0)}</p>
                    </div>
                    <p className="text-xs opacity-90">Tu ganancia</p>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{job.service.duration} min</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                <button
                  onClick={() => handleAcceptJob(job.id)}
                  disabled={isAccepting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAccepting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Aceptando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Aceptar Trabajo
                    </>
                  )}
                </button>

                {/* Botón Ver Ruta para evaluar distancia antes de aceptar */}
                {(job.latitude && job.longitude) ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <MapPin className="w-5 h-5" />
                    Ver Ruta
                  </a>
                ) : job.address && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <MapPin className="w-5 h-5" />
                    Ver Ruta
                  </a>
                )}
              </div>
            </div>
          );
        })}
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
