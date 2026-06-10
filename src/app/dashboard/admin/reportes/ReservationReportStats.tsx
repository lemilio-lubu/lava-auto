import { DollarSign, TrendingUp, CheckCircle, Users, Star, Briefcase } from 'lucide-react';

export interface ReservationStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  pendingReservations: number;
  activeUsers: number;
  totalWashers: number;
  topWashers: { washerId: string; washerName: string; count: number; revenue: number }[];
}

interface ReservationReportStatsProps {
  stats: ReservationStats;
  completionRate: number;
  avgTicket: number;
  monthlyProjection: number;
  dayOfMonth: number;
}

export default function ReservationReportStats({
  stats,
  completionRate,
  avgTicket,
  monthlyProjection,
  dayOfMonth,
}: ReservationReportStatsProps) {
  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ingresos Totales</p>
              <p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Ingresos del Mes</p>
              <p className="text-3xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Reservas Completadas</p>
              <p className="text-3xl font-bold">{stats.completedReservations}</p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Usuarios / Técnicos</p>
              <p className="text-3xl font-bold">{stats.activeUsers} / {stats.totalWashers}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Reservation breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Tasa de Completado
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{completionRate}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.completedReservations} de {stats.totalReservations} reservas
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Ticket Promedio
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">${avgTicket.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Por servicio completado
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Proyección Mensual
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">${monthlyProjection.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Basado en ritmo actual (día {dayOfMonth})
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Desglose de Reservas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pendientes',  value: stats.pendingReservations,   color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
            { label: 'Completadas', value: stats.completedReservations, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
            { label: 'Canceladas',  value: stats.cancelledReservations, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
            { label: 'Total',       value: stats.totalReservations,     color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg p-4 text-center ${color}`}>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Washers */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          Top 5 Técnicos por Ingresos Generados
        </h2>
        <div className="space-y-3">
          {stats.topWashers.map((item, index) => (
            <div
              key={item.washerId}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                  ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-500'}`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.washerName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.count} {item.count === 1 ? 'trabajo completado' : 'trabajos completados'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${item.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ${item.count > 0 ? Math.round(item.revenue / item.count).toLocaleString() : 0} promedio
                </p>
              </div>
            </div>
          ))}
          {stats.topWashers.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No hay servicios completados aún
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Los datos aparecerán cuando los técnicos completen trabajos
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
