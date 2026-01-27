'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MapPin, Clock, Car, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { jobApi } from '@/lib/api-client';

export default function TrabajosPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const data = await jobApi.getMyJobs(token);
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const activeJobs = jobs.filter(j => j.status === 'CONFIRMED' || j.status === 'IN_PROGRESS');
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Trabajos</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestiona tus trabajos asignados
        </p>
      </div>

      {/* Active Jobs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20">
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
            Trabajos Activos ({activeJobs.length})
          </h2>
        </div>
        
        {activeJobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">No tienes trabajos activos</p>
            <Link
              href="/dashboard/washer/disponibles"
              className="inline-block mt-4 text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Ver trabajos disponibles →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {activeJobs.map((job) => (
              <Link
                key={job.id}
                href={`/dashboard/washer/trabajos/${job.id}`}
                className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {job.service?.name || 'Servicio'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'IN_PROGRESS' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
                      }`}>
                        {job.status === 'IN_PROGRESS' ? 'En Progreso' : 'Confirmado'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {job.vehicle?.brand} {job.vehicle?.model}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.address || 'Sin dirección'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.scheduledDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${job.service?.price || 0}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Completed Jobs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Trabajos Completados ({completedJobs.length})
          </h2>
        </div>
        
        {completedJobs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">Aún no has completado trabajos</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {completedJobs.slice(0, 10).map((job) => (
              <div
                key={job.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {job.service?.name || 'Servicio'}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {job.vehicle?.brand} {job.vehicle?.model} - {new Date(job.completedAt || job.updatedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <p className="font-bold text-green-600 dark:text-green-400">
                  ${job.service?.price || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
