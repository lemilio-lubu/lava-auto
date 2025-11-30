import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Car as CarIcon, User, Clock, DollarSign } from 'lucide-react';
import JobActions from '@/components/washer/JobActions';

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export default async function TrabajosPage() {
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
          vehicle: true,
          user: true,
        },
        orderBy: { scheduledDate: 'desc' },
      },
    },
  });

  if (!user || user.role !== 'WASHER') {
    redirect('/dashboard');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayJobs = user.assignedJobs.filter(
    (job) =>
      new Date(job.scheduledDate) >= today &&
      new Date(job.scheduledDate) < tomorrow &&
      job.status !== 'CANCELLED' &&
      job.status !== 'COMPLETED'
  );

  const upcomingJobs = user.assignedJobs.filter(
    (job) =>
      new Date(job.scheduledDate) >= tomorrow &&
      job.status !== 'CANCELLED' &&
      job.status !== 'COMPLETED'
  );

  const completedJobs = user.assignedJobs.filter((job) => job.status === 'COMPLETED');

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Trabajos</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Administra todas tus asignaciones de lavado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Hoy</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{todayJobs.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Próximos</p>
          <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
            {upcomingJobs.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completados</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {completedJobs.length}
          </p>
        </div>
      </div>

      {todayJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Trabajos de Hoy</h2>
          <div className="space-y-4">
            {todayJobs.map((job) => (
              <JobCard key={job.id} job={job} isToday />
            ))}
          </div>
        </div>
      )}

      {upcomingJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Próximos Trabajos</h2>
          <div className="space-y-4">
            {upcomingJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Trabajos Completados</h2>
          <div className="space-y-4">
            {completedJobs.slice(0, 5).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {user.assignedJobs.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center border border-slate-200 dark:border-slate-700">
          <Calendar className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No tienes trabajos asignados
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Los trabajos aparecerán aquí cuando los administradores te los asignen
          </p>
        </div>
      )}
    </div>
  );
}

function JobCard({ job, isToday = false }: { job: any; isToday?: boolean }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border-2 ${
        isToday
          ? 'border-blue-500 dark:border-blue-400'
          : 'border-slate-200 dark:border-slate-700'
      } hover:shadow-lg transition-shadow`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                statusColors[job.status as keyof typeof statusColors]
              }`}
            >
              {statusLabels[job.status as keyof typeof statusLabels]}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {job.scheduledTime}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {job.service.name}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <User className="w-4 h-4" />
              <span>Cliente: {job.user.name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <CarIcon className="w-4 h-4" />
              <span>
                {job.vehicle.brand} {job.vehicle.model} - {job.vehicle.plate}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">${job.totalAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <JobActions jobId={job.id} status={job.status} />
          <Link
            href={`/dashboard/washer/trabajos/${job.id}`}
            className="text-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Ver Detalles
          </Link>
        </div>
      </div>
    </div>
  );
}
