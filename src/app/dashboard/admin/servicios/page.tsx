import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Clock, DollarSign, Sparkles, Edit, Trash2 } from 'lucide-react';

export default async function ServiciosPage() {
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

  const services = await prisma.service.findMany({
    include: {
      reservations: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    inactive: services.filter((s) => !s.isActive).length,
    totalRevenue: services.reduce(
      (sum, s) =>
        sum +
        s.reservations
          .filter((r) => r.status === 'COMPLETED')
          .reduce((rSum, r) => rSum + Number(r.totalAmount), 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Gestión de Servicios
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Administra el catálogo de servicios de lavado
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Servicios</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Activos</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Inactivos</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Ingresos Totales</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            ${stats.totalRevenue.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border-2 ${
              service.isActive
                ? 'border-slate-200 dark:border-slate-700'
                : 'border-red-200 dark:border-red-800 opacity-60'
            } hover:shadow-lg transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-100 to-emerald-100 dark:from-cyan-900/30 dark:to-emerald-900/30 rounded-lg">
                <Sparkles className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {service.name}
                </h3>
                {!service.isActive && (
                  <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full font-semibold">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{service.description}</p>
            </div>

            <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm">Precio</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${service.price.toFixed(0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Duración</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {service.duration} min
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Reservas</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {service.reservations.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Completadas</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {service.reservations.filter((r) => r.status === 'COMPLETED').length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Ingresos</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  $
                  {service.reservations
                    .filter((r) => r.status === 'COMPLETED')
                    .reduce((sum, r) => sum + Number(r.totalAmount), 0)
                    .toFixed(0)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors ${
                  service.isActive
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                }`}
              >
                {service.isActive ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
          Recomendaciones para Servicios
        </h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Define precios competitivos basados en el mercado local y calidad del servicio
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Establece duraciones realistas para que los lavadores puedan cumplir los tiempos
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Incluye descripciones claras de lo que incluye cada servicio para evitar confusiones
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Desactiva servicios temporalmente en lugar de eliminarlos para mantener historial
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
