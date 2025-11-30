import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default async function CalendarioPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      assignedJobs: {
        include: {
          service: true,
          user: true,
          vehicle: true,
        },
        orderBy: { scheduledDate: 'asc' },
      },
    },
  });

  if (!user || user.role !== 'WASHER') {
    redirect('/dashboard');
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const jobs = user.assignedJobs.filter((job) => {
    const jobDate = new Date(job.scheduledDate);
    return (
      jobDate.getMonth() === currentMonth &&
      jobDate.getFullYear() === currentYear &&
      job.status !== 'CANCELLED'
    );
  });

  const jobsByDay: Record<number, typeof jobs> = {};
  jobs.forEach((job) => {
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
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
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
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                        {dayJobs.length}
                      </div>
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

        {jobs.length === 0 ? (
          <p className="text-center text-slate-600 dark:text-slate-400 py-8">
            No tienes trabajos programados este mes
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
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
                    {new Date(job.scheduledDate).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
