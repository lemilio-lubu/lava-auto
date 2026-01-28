'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, DollarSign, Clock, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { jobApi, reservationApi } from '@/lib/api-client';

export default function WasherDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedToday: 0,
    totalEarnings: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'WASHER') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      Promise.all([
        jobApi.getMyJobs(token),
      ])
        .then(([jobs]) => {
          const activeJobs = jobs.filter((j: any) => 
            j.status === 'CONFIRMED' || j.status === 'IN_PROGRESS'
          );
          const completedToday = jobs.filter((j: any) => {
            const today = new Date().toDateString();
            return j.status === 'COMPLETED' && new Date(j.completedAt).toDateString() === today;
          });
          
          setStats({
            activeJobs: activeJobs.length,
            completedToday: completedToday.length,
            totalEarnings: jobs.filter((j: any) => j.status === 'COMPLETED')
              .reduce((sum: number, j: any) => sum + (j.service?.price || 0), 0),
          });
          setRecentJobs(jobs.slice(0, 5));
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user, token, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">¡Hola, {user?.name}!</h1>
        <p className="text-emerald-50">
          Gestiona tus trabajos y maximiza tus ganancias
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Trabajos Activos</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeJobs}</p>
            </div>
            <Briefcase className="w-12 h-12 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Completados Hoy</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completedToday}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Ganancias Totales</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">${stats.totalEarnings}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-500" />
          </div>
        </div>

        </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/washer/disponibles"
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
        >
          <div>
            <h3 className="text-xl font-bold mb-1">Trabajos Disponibles</h3>
            <p className="text-emerald-100">Encuentra nuevos trabajos cerca de ti</p>
          </div>
          <TrendingUp className="w-12 h-12 opacity-80" />
        </Link>

        <Link
          href="/dashboard/washer/trabajos"
          className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
        >
          <div>
            <h3 className="text-xl font-bold mb-1">Mis Trabajos</h3>
            <p className="text-cyan-100">Ver trabajos asignados y en progreso</p>
          </div>
          <Briefcase className="w-12 h-12 opacity-80" />
        </Link>
      </div>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trabajos Recientes</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {recentJobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {job.service?.name || 'Servicio'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {job.vehicle?.brand} {job.vehicle?.model} - {job.address}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    job.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    job.status === 'CONFIRMED' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {job.status === 'COMPLETED' ? 'Completado' :
                     job.status === 'IN_PROGRESS' ? 'En Progreso' :
                     job.status === 'CONFIRMED' ? 'Confirmado' :
                     'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
