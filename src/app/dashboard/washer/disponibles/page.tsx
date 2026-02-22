'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MapPin, Clock, DollarSign, Car } from 'lucide-react';
import { jobApi } from '@/lib/api-client';

export default function DisponiblesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'WASHER') {
      router.push('/dashboard');
      return;
    }

    loadJobs();
  }, [user, token, authLoading, router]);

  const loadJobs = async () => {
    if (!token) return;
    try {
      const data = await jobApi.getAvailable(token);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    if (!token) return;
    setAccepting(jobId);
    try {
      await jobApi.accept(jobId, token);
      router.push('/dashboard/washer/trabajos');
    } catch (error) {
      console.error('Error accepting job:', error);
      alert('Error al aceptar el trabajo');
    } finally {
      setAccepting(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trabajos Disponibles</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Acepta trabajos cercanos para comenzar a ganar
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <Clock className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No hay trabajos disponibles
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Los nuevos trabajos aparecerán aquí. ¡Mantente atento!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {job.serviceName || 'Servicio de Lavado'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Cliente
                  </p>
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${job.totalAmount || 0}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Car className="w-4 h-4" />
                  <span>{job.vehicle?.brand} {job.vehicle?.model} - {job.vehicle?.plate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{job.address || 'Dirección no especificada'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(job.scheduledDate).toLocaleDateString('es-ES')} - {job.scheduledTime || 'Por definir'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleAccept(job.id)}
                disabled={accepting === job.id}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accepting === job.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Aceptando...
                  </span>
                ) : (
                  'Aceptar Trabajo'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
