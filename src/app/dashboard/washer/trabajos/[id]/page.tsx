'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MapPin, Clock, Car, Play, CheckCircle, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { jobApi } from '@/lib/api-client';

export default function JobDetailPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [proofImages, setProofImages] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'WASHER') {
      router.push('/dashboard');
      return;
    }

    loadJob();
  }, [user, token, authLoading, router, jobId]);

  const loadJob = async () => {
    if (!token || !jobId) return;
    try {
      const jobs = await jobApi.getMyJobs(token);
      const foundJob = jobs.find((j: any) => j.id === jobId);
      if (foundJob) {
        setJob(foundJob);
      } else {
        router.push('/dashboard/washer/trabajos');
      }
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      await jobApi.start(jobId, token);
      await loadJob();
    } catch (error) {
      console.error('Error starting job:', error);
      alert('Error al iniciar el trabajo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      await jobApi.complete(jobId, proofImages, token);
      router.push('/dashboard/washer/trabajos');
    } catch (error) {
      console.error('Error completing job:', error);
      alert('Error al completar el trabajo');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Trabajo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/dashboard/washer/trabajos"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis trabajos
      </Link>

      {/* Job Status Header */}
      <div className={`rounded-xl p-6 ${
        job.status === 'IN_PROGRESS' 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
          : job.status === 'COMPLETED'
          ? 'bg-gradient-to-r from-green-500 to-green-600'
          : 'bg-gradient-to-r from-cyan-500 to-cyan-600'
      } text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Estado actual</p>
            <h1 className="text-2xl font-bold">
              {job.status === 'IN_PROGRESS' ? 'En Progreso' :
               job.status === 'COMPLETED' ? 'Completado' : 'Confirmado'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Ganancia</p>
            <p className="text-3xl font-bold">${job.service?.price || 0}</p>
          </div>
        </div>
      </div>

      {/* Service Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {job.service?.name || 'Servicio de Lavado'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {job.service?.description || 'Sin descripción'}
        </p>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Car className="w-5 h-5" />
          Vehículo
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Marca/Modelo</p>
            <p className="font-medium text-slate-900 dark:text-white">
              {job.vehicle?.brand} {job.vehicle?.model}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Placa</p>
            <p className="font-medium text-slate-900 dark:text-white">{job.vehicle?.plate}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Color</p>
            <p className="font-medium text-slate-900 dark:text-white">{job.vehicle?.color || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Año</p>
            <p className="font-medium text-slate-900 dark:text-white">{job.vehicle?.year || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Client & Location */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cliente</p>
              <p className="font-medium text-slate-900 dark:text-white">{job.client?.name || 'Cliente'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Ubicación</p>
              <p className="font-medium text-slate-900 dark:text-white">{job.address || 'No especificada'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Fecha y hora</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {new Date(job.scheduledDate).toLocaleDateString('es-ES')} - {job.scheduledTime || 'Por definir'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {job.status !== 'COMPLETED' && (
        <div className="space-y-4">
          {job.status === 'CONFIRMED' && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Iniciar Trabajo
                </>
              )}
            </button>
          )}

          {job.status === 'IN_PROGRESS' && (
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Completar Trabajo
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
