import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Users, Briefcase, DollarSign, TrendingUp, Calendar, Star } from 'lucide-react';
import Link from 'next/link';

/**
 * Dashboard del ADMIN
 * 
 * Funciones del administrador:
 * 1. Ver métricas generales del negocio
 * 2. Gestionar usuarios (clientes, lavadores, admins)
 * 3. Ver todas las reservas del sistema
 * 4. Gestionar servicios y precios
 * 5. Asignar lavadores a trabajos manualmente
 * 6. Ver reportes de calificaciones
 * 7. Resolver problemas y disputas
 */
export default async function AdminDashboard() {
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

  // Métricas generales
  const [
    totalClients,
    totalWashers,
    totalReservations,
    activeReservations,
    completedReservations,
    totalRevenue,
    averageRating,
    recentReservations,
    topWashers,
  ] = await Promise.all([
    // Total de clientes
    prisma.user.count({ where: { role: 'CLIENT' } }),
    
    // Total de lavadores
    prisma.user.count({ where: { role: 'WASHER' } }),
    
    // Total de reservas
    prisma.reservation.count(),
    
    // Reservas activas (confirmadas o en proceso)
    prisma.reservation.count({
      where: {
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS'],
        },
      },
    }),
    
    // Reservas completadas
    prisma.reservation.count({
      where: { status: 'COMPLETED' },
    }),
    
    // Ingresos totales
    prisma.reservation.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
    }),
    
    // Calificación promedio
    prisma.rating.aggregate({
      _avg: { stars: true },
    }),
    
    // Últimas 10 reservas
    prisma.reservation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
        washer: {
          select: { name: true, rating: true },
        },
        service: {
          select: { name: true },
        },
        vehicle: {
          select: { brand: true, model: true, plate: true },
        },
      },
    }),
    
    // Top 5 lavadores
    prisma.user.findMany({
      where: { role: 'WASHER' },
      orderBy: { rating: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        rating: true,
        completedServices: true,
        isAvailable: true,
      },
    }),
  ]);

  const revenueThisMonth = await prisma.reservation.aggregate({
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: { totalAmount: true },
  });

  return (
    <div className="space-y-6">
      {/* Header del Admin */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-purple-50 text-lg">
          Vista general del negocio y gestión del sistema
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Clientes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {totalClients}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Clientes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Registrados</p>
        </div>

        {/* Total Lavadores */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-8 h-8 text-cyan-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {totalWashers}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Lavadores</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">En la plataforma</p>
        </div>

        {/* Reservas activas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-amber-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {activeReservations}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Activas</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            De {totalReservations} totales
          </p>
          <Link href="/dashboard/admin/reservas" className="text-amber-600 dark:text-amber-400 text-sm hover:underline mt-2 block">
            Ver todas →
          </Link>
        </div>

        {/* Ingresos totales */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              ${(totalRevenue._sum.totalAmount || 0).toFixed(0)}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Ingresos</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ${(revenueThisMonth._sum.totalAmount || 0).toFixed(0)} este mes
          </p>
        </div>
      </div>

      {/* Grid de información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calificación promedio */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-10 h-10" />
            <span className="text-4xl font-bold">
              {averageRating._avg.stars?.toFixed(1) || '5.0'}
            </span>
          </div>
          <h3 className="font-semibold text-lg">Calificación Promedio</h3>
          <p className="text-amber-50 text-sm">Calidad del servicio</p>
        </div>

        {/* Tasa de finalización */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10" />
            <span className="text-4xl font-bold">
              {totalReservations > 0 
                ? Math.round((completedReservations / totalReservations) * 100) 
                : 0}%
            </span>
          </div>
          <h3 className="font-semibold text-lg">Tasa de Finalización</h3>
          <p className="text-green-50 text-sm">
            {completedReservations} de {totalReservations} completadas
          </p>
        </div>
      </div>

      {/* Top Lavadores */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Top Lavadores
          </h2>
        </div>

        <div className="space-y-3">
          {topWashers.map((washer, index) => (
            <div 
              key={washer.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-300'}
                `}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {washer.name}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {washer.rating?.toFixed(1) || '5.0'}
                    </span>
                    <span>• {washer.completedServices} servicios</span>
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-semibold
                      ${washer.isAvailable 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}
                    `}>
                      {washer.isAvailable ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas reservas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            📋 Últimas Reservas
          </h2>
          <Link 
            href="/dashboard/admin/reservas"
            className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        <div className="space-y-3">
          {recentReservations.map((reservation) => (
            <div 
              key={reservation.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`
                    w-3 h-3 rounded-full
                    ${reservation.status === 'COMPLETED' ? 'bg-green-500' : 
                      reservation.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      reservation.status === 'CONFIRMED' ? 'bg-amber-500' :
                      reservation.status === 'CANCELLED' ? 'bg-red-500' :
                      'bg-slate-400'}
                  `} />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {reservation.service.name}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {reservation.vehicle.brand} {reservation.vehicle.model} ({reservation.vehicle.plate})
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cliente: {reservation.user.name}
                  {reservation.washer && ` • Lavador: ${reservation.washer.name} ⭐ ${reservation.washer.rating?.toFixed(1)}`}
                  {' • '}
                  {new Date(reservation.scheduledDate).toLocaleDateString('es-ES')} a las {reservation.scheduledTime}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 dark:text-green-400">
                  ${reservation.totalAmount.toFixed(0)}
                </p>
                <span className={`
                  text-xs px-2 py-1 rounded-full font-semibold
                  ${reservation.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    reservation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    reservation.status === 'CONFIRMED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    reservation.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}
                `}>
                  {reservation.status === 'COMPLETED' ? 'Completado' :
                   reservation.status === 'IN_PROGRESS' ? 'En proceso' :
                   reservation.status === 'CONFIRMED' ? 'Confirmado' :
                   reservation.status === 'CANCELLED' ? 'Cancelado' :
                   'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones rápidas del admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/admin/servicios"
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
        >
          <Briefcase className="w-10 h-10 text-cyan-500 mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">
            Gestionar Servicios
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Crear, editar o desactivar servicios y precios
          </p>
        </Link>

        <Link
          href="/dashboard/admin/reportes"
          className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
        >
          <TrendingUp className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">
            Ver Reportes
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Análisis de ventas, calificaciones y métricas
          </p>
        </Link>
      </div>
    </div>
  );
}
