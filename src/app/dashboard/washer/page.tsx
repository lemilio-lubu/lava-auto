import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Briefcase, Star, DollarSign, CheckCircle, Clock, MapPin, Camera, Car, Bell } from 'lucide-react';
import Link from 'next/link';
import AvailabilityToggle from '@/components/washer/AvailabilityToggle';
import AvailableJobs from '@/components/washer/AvailableJobs';

/**
 * Dashboard del WASHER (Lavador)
 * 
 * Flujo de negocio:
 * 1. Washer activa/desactiva su disponibilidad
 * 2. Sistema le asigna trabajos según su ubicación y disponibilidad
 * 3. Washer ve los trabajos asignados del día
 * 4. Marca cuando está "en camino" (notifica al cliente)
 * 5. Marca cuando "inicia el servicio"
 * 6. Sube fotos ANTES y DESPUÉS del lavado (prueba de servicio)
 * 7. Marca el trabajo como completado
 * 8. Cliente califica al washer
 * 9. Washer acumula calificación y contador de servicios completados
 */
export default async function WasherDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      assignedJobs: {
        select: {
          id: true,
          scheduledDate: true,
          scheduledTime: true,
          status: true,
          totalAmount: true,
          address: true,
          latitude: true,
          longitude: true,
          service: {
            select: {
              name: true,
              duration: true,
            },
          },
          vehicle: {
            select: {
              brand: true,
              model: true,
              plate: true,
            },
          },
          user: {
            select: {
              name: true,
              phone: true,
              address: true,
            },
          },
        },
        where: {
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS'],
          },
        },
        orderBy: { scheduledDate: 'asc' },
      },
      receivedRatings: {
        include: {
          reservation: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!user || user.role !== 'WASHER') {
    redirect('/dashboard');
  }

  // Obtener trabajos disponibles (PENDING sin asignar)
  const availableJobs = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      washerId: null,
    },
    select: {
      id: true,
      scheduledDate: true,
      scheduledTime: true,
      status: true,
      totalAmount: true,
      address: true,
      latitude: true,
      longitude: true,
      service: {
        select: {
          name: true,
          duration: true,
        },
      },
      vehicle: {
        select: {
          brand: true,
          model: true,
          plate: true,
        },
      },
      user: {
        select: {
          name: true,
          phone: true,
          address: true,
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 10, // Mostrar máximo 10 trabajos disponibles
  });

  const todayJobs = user.assignedJobs.filter(job => {
    const jobDate = new Date(job.scheduledDate);
    const today = new Date();
    return jobDate.toDateString() === today.toDateString();
  });

  const upcomingJobs = user.assignedJobs.filter(job => {
    const jobDate = new Date(job.scheduledDate);
    const today = new Date();
    return jobDate > today;
  });

  // Calcular ganancias estimadas del mes
  const currentMonth = new Date().getMonth();
  const completedThisMonth = await prisma.reservation.count({
    where: {
      washerId: user.id,
      status: 'COMPLETED',
      completedAt: {
        gte: new Date(new Date().getFullYear(), currentMonth, 1),
      },
    },
  });

  const earningsThisMonth = await prisma.reservation.aggregate({
    where: {
      washerId: user.id,
      status: 'COMPLETED',
      completedAt: {
        gte: new Date(new Date().getFullYear(), currentMonth, 1),
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header del Washer con toggle de disponibilidad */}
      <AvailabilityToggle isAvailable={user.isAvailable} userName={user.name} />

      {/* Trabajos Disponibles - NUEVO */}
      {user.isAvailable && availableJobs.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg p-6 border-2 border-amber-300 dark:border-amber-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                {availableJobs.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{availableJobs.length}</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  🚨 Trabajos Disponibles
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {availableJobs.length} {availableJobs.length === 1 ? 'nuevo pedido' : 'nuevos pedidos'} esperando por ti
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/washer/disponibles"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Ver Todos
            </Link>
          </div>

          <AvailableJobs jobs={availableJobs} />
        </div>
      )}

      {user.isAvailable && availableJobs.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Esperando nuevos pedidos
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Estás disponible. Los trabajos nuevos aparecerán aquí automáticamente
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas del Washer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Calificación */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8 text-amber-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {user.rating?.toFixed(1) || '5.0'}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Calificación</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {user.receivedRatings.length} reseñas
          </p>
        </div>

        {/* Servicios completados */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {user.completedServices}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Completados</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total histórico</p>
        </div>

        {/* Trabajos de hoy */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {todayJobs.length}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Hoy</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Trabajos pendientes</p>
        </div>

        {/* Ganancias del mes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              ${earningsThisMonth._sum.totalAmount?.toFixed(0) || '0'}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Este Mes</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {completedThisMonth} servicios
          </p>
        </div>
      </div>

      {/* Trabajos de hoy */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              📅 Trabajos de Hoy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {todayJobs.length === 0 
                ? 'No tienes trabajos programados para hoy' 
                : `Tienes ${todayJobs.length} trabajo${todayJobs.length > 1 ? 's' : ''} programado${todayJobs.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Briefcase className="w-8 h-8 text-cyan-500" />
        </div>

        {todayJobs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {user.isAvailable 
                ? 'Todo listo. Espera a que te asignen trabajos nuevos' 
                : 'Activa tu disponibilidad para recibir trabajos'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayJobs.map((job) => (
              <div 
                key={job.id}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-700/30"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-bold
                        ${job.status === 'IN_PROGRESS' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}
                      `}>
                        {job.status === 'IN_PROGRESS' ? '🚗 En Proceso' : '⏰ Confirmado'}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {job.scheduledTime}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {job.service.name}
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      Cliente: {job.user.name} • {job.user.phone}
                    </p>
                    
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                      <Car className="w-4 h-4" />
                      <span>{job.vehicle.brand} {job.vehicle.model} • {job.vehicle.plate}</span>
                    </div>

                    {(job.address || job.user.address) && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{job.address || job.user.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${job.totalAmount.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pago</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                  {/* Botón Ver Ruta - siempre visible si hay ubicación */}
                  {(job.latitude && job.longitude) ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-md"
                    >
                      <MapPin className="w-4 h-4" />
                      Ver Ruta
                    </a>
                  ) : (job.address || job.user.address) ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address || job.user.address || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-md"
                    >
                      <MapPin className="w-4 h-4" />
                      Ver Ruta
                    </a>
                  ) : null}
                  
                  {job.status === 'CONFIRMED' && (
                    <Link
                      href={`/dashboard/washer/trabajos/${job.id}`}
                      className="flex-1 bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-600 transition-colors text-center"
                    >
                      Ver Trabajo y Gestionar
                    </Link>
                  )}
                  
                  {job.status === 'IN_PROGRESS' && (
                    <Link
                      href={`/dashboard/washer/trabajos/${job.id}`}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Ir a Completar Trabajo
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximos trabajos */}
      {upcomingJobs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            📆 Próximos Trabajos
          </h2>
          <div className="space-y-4">
            {upcomingJobs.map((job) => (
              <div 
                key={job.id}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-700/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        {job.status === 'IN_PROGRESS' ? '🚗 En Proceso' : '⏰ Confirmado'}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                        {new Date(job.scheduledDate).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })} • {job.scheduledTime}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {job.service.name}
                    </h3>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Cliente: {job.user.name}
                    </p>
                    
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                      <Car className="w-4 h-4" />
                      <span className="text-sm">{job.vehicle.brand} {job.vehicle.model} • {job.vehicle.plate}</span>
                    </div>

                    {(job.address || job.user.address) && (
                      <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{job.address || job.user.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${job.totalAmount.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                  {/* Botón Ver Ruta */}
                  {(job.latitude && job.longitude) ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <MapPin className="w-4 h-4" />
                      Ver Ruta
                    </a>
                  ) : (job.address || job.user.address) ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address || job.user.address || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <MapPin className="w-4 h-4" />
                      Ver Ruta
                    </a>
                  ) : null}
                  
                  <Link
                    href={`/dashboard/washer/trabajos/${job.id}`}
                    className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors text-center"
                  >
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas calificaciones recibidas */}
      {user.receivedRatings.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            ⭐ Últimas Calificaciones
          </h2>
          <div className="space-y-3">
            {user.receivedRatings.map((rating) => (
              <div 
                key={rating.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
              >
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {rating.reservation.user.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rating.stars
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">
                      "{rating.comment}"
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-500">{rating.stars}.0</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
