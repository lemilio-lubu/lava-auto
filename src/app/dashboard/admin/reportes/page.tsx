import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, DollarSign, Users, Calendar, Wrench, Star, Award } from 'lucide-react';

export default async function ReportesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [
    totalClients,
    totalWashers,
    totalReservations,
    completedReservations,
    services,
    ratings,
    allReservations,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'WASHER' } }),
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: 'COMPLETED' } }),
    prisma.service.findMany({ include: { reservations: true } }),
    prisma.rating.findMany(),
    prisma.reservation.findMany({
      where: { status: 'COMPLETED' },
      include: { service: true, user: true },
    }),
  ]);

  const totalRevenue = allReservations.reduce((sum, r) => sum + Number(r.totalAmount), 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length : 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthReservations = allReservations.filter((r) => {
    const date = new Date(r.completedAt || r.scheduledDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthRevenue = monthReservations.reduce((sum, r) => sum + Number(r.totalAmount), 0);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentYear, currentMonth - (5 - i), 1);
    const monthRevs = allReservations.filter((r) => {
      const rDate = new Date(r.completedAt || r.scheduledDate);
      return rDate.getMonth() === date.getMonth() && rDate.getFullYear() === date.getFullYear();
    });
    return {
      month: date.toLocaleDateString('es-MX', { month: 'short' }),
      revenue: monthRevs.reduce((sum, r) => sum + Number(r.totalAmount), 0),
      count: monthRevs.length,
    };
  });

  const maxRevenue = Math.max(...last6Months.map((m) => m.revenue), 1);

  const topServices = services
    .map((s) => ({
      name: s.name,
      count: s.reservations.filter((r) => r.status === 'COMPLETED').length,
      revenue: s.reservations
        .filter((r) => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + Number(r.totalAmount), 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes y Métricas</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análisis del desempeño del negocio
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-emerald-100 text-sm mb-1">Ingresos del Mes</p>
          <p className="text-3xl font-bold">${monthRevenue.toFixed(0)}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-cyan-100 text-sm mb-1">Reservas Completadas</p>
          <p className="text-3xl font-bold">{completedReservations}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-purple-100 text-sm mb-1">Clientes Activos</p>
          <p className="text-3xl font-bold">{totalClients}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-8 h-8" />
            <Award className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-amber-100 text-sm mb-1">Calificación Promedio</p>
          <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ingresos de los últimos 6 meses
          </h2>
          <div className="space-y-4">
            {last6Months.map((month, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {month.month}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {month.count} reservas - ${month.revenue.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full transition-all"
                    style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Ingresos Totales
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ${totalRevenue.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Servicios Más Populares
          </h2>
          <div className="space-y-4">
            {topServices.map((service, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{service.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {service.count} servicios realizados
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${service.revenue.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${(service.revenue / topServices[0]?.revenue || 1) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuarios
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Clientes</span>
              <span className="font-bold text-slate-900 dark:text-white">{totalClients}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Lavadores</span>
              <span className="font-bold text-slate-900 dark:text-white">{totalWashers}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {totalClients + totalWashers}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reservas
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
              <span className="font-bold text-slate-900 dark:text-white">{totalReservations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Completadas</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {completedReservations}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Tasa de Éxito
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalReservations > 0
                  ? ((completedReservations / totalReservations) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Finanzas
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Este Mes</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ${monthRevenue.toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Ticket Promedio</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ${completedReservations > 0 ? (totalRevenue / completedReservations).toFixed(0) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Total Histórico
              </span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${totalRevenue.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
