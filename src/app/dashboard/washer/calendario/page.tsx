'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Job {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  service: {
    name: string;
  };
  user: {
    name: string;
  };
  vehicle: {
    brand: string;
    model: string;
  };
}

export default function CalendarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Obtener trabajos confirmados/en proceso/completados del lavador
        const [confirmed, inProgress, completed] = await Promise.all([
          fetch('/api/jobs?status=CONFIRMED').then(r => r.json()),
          fetch('/api/jobs?status=IN_PROGRESS').then(r => r.json()),
          fetch('/api/jobs?status=COMPLETED').then(r => r.json()),
        ]);
        
        const allJobs = [...(confirmed || []), ...(inProgress || []), ...(completed || [])];
        setJobs(allJobs);
      } catch (error) {
        console.error('Error al cargar trabajos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchJobs();
    }
  }, [session]);

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const filteredJobs = jobs.filter((job) => {
    const jobDate = new Date(job.scheduledDate);
    return (
      jobDate.getMonth() === currentMonth &&
      jobDate.getFullYear() === currentYear &&
      job.status !== 'CANCELLED'
    );
  });

  const jobsByDay: Record<number, Job[]> = {};
  filteredJobs.forEach((job) => {
    const day = new Date(job.scheduledDate).getDate();
    if (!jobsByDay[day]) {
      jobsByDay[day] = [];
    }
    jobsByDay[day].push(job);
  });

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  const now = new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/washer"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendario</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Vista de tus trabajos programados del mes
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}
          
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday =
              day === now.getDate() &&
              currentMonth === now.getMonth() &&
              currentYear === now.getFullYear();
            const dayJobs = jobsByDay[day] || [];
            const hasJobs = dayJobs.length > 0;
            
            // Contar trabajos activos (no completados) y completados
            const activeJobs = dayJobs.filter(job => job.status !== 'COMPLETED').length;
            const completedJobs = dayJobs.filter(job => job.status === 'COMPLETED').length;

            return (
              <div
                key={day}
                className={`aspect-square p-2 border rounded-lg transition-colors ${
                  isToday
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                } ${hasJobs ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''} hover:border-cyan-500`}
              >
                <div className="h-full flex flex-col">
                  <span
                    className={`text-sm font-semibold ${
                      isToday
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {day}
                  </span>
                  {hasJobs && (
                    <div className="flex-1 flex items-center justify-center gap-1">
                      {activeJobs > 0 && (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                          {activeJobs}
                        </div>
                      )}
                      {completedJobs > 0 && (
                        <div className="w-6 h-6 rounded-full bg-slate-400 dark:bg-slate-600 text-white text-xs font-bold flex items-center justify-center">
                          {completedJobs}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Trabajos del Mes
        </h3>

        {filteredJobs.length === 0 ? (
          <p className="text-center text-slate-600 dark:text-slate-400 py-8">
            No tienes trabajos programados este mes
          </p>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {job.service.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {job.user.name} - {job.vehicle.brand} {job.vehicle.model}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {new Date(job.scheduledDate).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {job.scheduledTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
