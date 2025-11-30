import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, DollarSign, Star, Calendar, Award } from 'lucide-react';

export default async function EstadisticasPage() {
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
        },
      },
      receivedRatings: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user || user.role !== 'WASHER') {
    redirect('/dashboard');
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const completedJobs = user.assignedJobs.filter((job) => job.status === 'COMPLETED');
  const monthJobs = completedJobs.filter((job) => {
    const jobDate = new Date(job.completedAt || job.scheduledDate);
    return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
  });

  const totalEarnings = completedJobs.reduce((sum, job) => sum + Number(job.totalAmount), 0);
  const monthEarnings = monthJobs.reduce((sum, job) => sum + Number(job.totalAmount), 0);

  const avgRating =
    user.receivedRatings.length > 0
      ? user.receivedRatings.reduce((sum, r) => sum + r.stars, 0) / user.receivedRatings.length
      : 0;

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - (5 - i), 1);
    return {
      month: date.toLocaleDateString('es-MX', { month: 'short' }),
      jobs: completedJobs.filter((job) => {
        const jobDate = new Date(job.completedAt || job.scheduledDate);
        return (
          jobDate.getMonth() === date.getMonth() && jobDate.getFullYear() === date.getFullYear()
        );
      }).length,
      earnings: completedJobs
        .filter((job) => {
          const jobDate = new Date(job.completedAt || job.scheduledDate);
          return (
            jobDate.getMonth() === date.getMonth() && jobDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, job) => sum + Number(job.totalAmount), 0),
    };
  });

  const maxEarnings = Math.max(...last6Months.map((m) => m.earnings), 1);

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Estadísticas</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Analiza tu desempeño y ganancias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-emerald-100 text-sm mb-1">Ganancias del Mes</p>
          <p className="text-3xl font-bold">${monthEarnings.toFixed(0)}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-cyan-100 text-sm mb-1">Trabajos del Mes</p>
          <p className="text-3xl font-bold">{monthJobs.length}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8" />
            <Award className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-amber-100 text-sm mb-1">Calificación Promedio</p>
          <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-purple-100 text-sm mb-1">Total Completados</p>
          <p className="text-3xl font-bold">{completedJobs.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
          Ganancias de los últimos 6 meses
        </h2>
        <div className="space-y-4">
          {last6Months.map((month, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900 dark:text-white capitalize">
                  {month.month}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {month.jobs} trabajos - ${month.earnings.toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full transition-all"
                  style={{ width: `${(month.earnings / maxEarnings) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Ganancias Totales
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${totalEarnings.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Calificaciones Recientes
        </h2>
        {user.receivedRatings.length === 0 ? (
          <p className="text-center text-slate-600 dark:text-slate-400 py-8">
            Aún no tienes calificaciones
          </p>
        ) : (
          <div className="space-y-4">
            {user.receivedRatings.slice(0, 5).map((rating) => (
              <div
                key={rating.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < rating.stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{rating.comment}</p>
                  )}
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-500">
                  {new Date(rating.createdAt).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Servicios Más Realizados</h3>
          <div className="space-y-3">
            {Object.entries(
              completedJobs.reduce((acc, job) => {
                const name = job.service.name;
                acc[name] = (acc[name] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([service, count]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{service}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Rendimiento</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Tasa de Completitud
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {user.assignedJobs.length > 0
                    ? ((completedJobs.length / user.assignedJobs.length) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${
                      user.assignedJobs.length > 0
                        ? (completedJobs.length / user.assignedJobs.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Valoraciones con 5 estrellas
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {user.receivedRatings.length > 0
                    ? (
                        (user.receivedRatings.filter((r) => r.stars === 5).length /
                          user.receivedRatings.length) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${
                      user.receivedRatings.length > 0
                        ? (user.receivedRatings.filter((r) => r.stars === 5).length /
                            user.receivedRatings.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
