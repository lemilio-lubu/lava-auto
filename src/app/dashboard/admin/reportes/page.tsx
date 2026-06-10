'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, DollarSign, TrendingUp, Users, Briefcase, Star, CheckCircle } from 'lucide-react';
import { adminApi, reservationApi, employeeApi, workOrderApi, WorkOrder, WorkOrderStats } from '@/lib/api-client';

export default function ReportesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    pendingReservations: 0,
    activeUsers: 0,
    totalWashers: 0,
    topWashers: [] as { washerId: string; washerName: string; count: number; revenue: number }[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [woStats, setWoStats] = useState<WorkOrderStats | null>(null);
  const [woOrders, setWoOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      Promise.all([
        adminApi.getUsers(token),
        reservationApi.getAllReservations(token),
        employeeApi.getAll(token),
      ])
        .then(([users, reservations, washers]) => {
          // Build washer name lookup map (id â†’ name)
          const washerNameMap = new Map<string, string>();
          washers.forEach((w: any) => washerNameMap.set(w.id, w.name));

          const completed = reservations.filter((r: any) => r.status === 'COMPLETED');
          const cancelled = reservations.filter((r: any) => r.status === 'CANCELLED');
          const pending = reservations.filter((r: any) => r.status === 'PENDING');

          const thisMonth = new Date().getMonth();
          const thisYear = new Date().getFullYear();
          const monthlyCompleted = completed.filter((r: any) => {
            const date = new Date(r.completedAt || r.createdAt);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
          });

          // Revenue uses totalAmount (the real persisted price per reservation)
          const totalRevenue = completed.reduce(
            (sum: number, r: any) => sum + (parseFloat(r.totalAmount) || 0),
            0
          );
          const monthlyRevenue = monthlyCompleted.reduce(
            (sum: number, r: any) => sum + (parseFloat(r.totalAmount) || 0),
            0
          );

          // Build top washers from completed reservations
          const washerStatsMap = new Map<string, { count: number; revenue: number }>();
          completed.forEach((r: any) => {
            if (!r.washerId) return;
            const current = washerStatsMap.get(r.washerId) || { count: 0, revenue: 0 };
            washerStatsMap.set(r.washerId, {
              count: current.count + 1,
              revenue: current.revenue + (parseFloat(r.totalAmount) || 0),
            });
          });

          const topWashers = Array.from(washerStatsMap.entries())
            .map(([washerId, data]) => ({
              washerId,
              washerName: washerNameMap.get(washerId) || `Lavador (${washerId.slice(-4)})`,
              ...data,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

          setStats({
            totalRevenue,
            monthlyRevenue,
            totalReservations: reservations.length,
            completedReservations: completed.length,
            cancelledReservations: cancelled.length,
            pendingReservations: pending.length,
            activeUsers: users.filter((u: any) => u.role !== 'EMPLOYEE').length,
            totalWashers: washers.length,
            topWashers,
          });
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user, token, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'ADMIN' || !token) return;

    Promise.all([
      workOrderApi.getStats(token),
      workOrderApi.getAll(token, { limit: 100 }),
    ])
      .then(([statsRes, ordersRes]) => {
        setWoStats(statsRes.data);
        setWoOrders(ordersRes.data);
      })
      .catch(console.error);
  }, [user, token, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const completionRate = stats.totalReservations > 0
    ? Math.round((stats.completedReservations / stats.totalReservations) * 100)
    : 0;

  const avgTicket = stats.completedReservations > 0
    ? Math.round(stats.totalRevenue / stats.completedReservations)
    : 0;

  const dayOfMonth = new Date().getDate();
  const monthlyProjection = dayOfMonth > 0
    ? Math.round(stats.monthlyRevenue * (30 / dayOfMonth))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes y Analíticas</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Estadísticas y métricas del negocio
        </p>
      </div>

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
            ProyecciÃ³n Mensual
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">${monthlyProjection.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Basado en ritmo actual (dÃ­a {dayOfMonth})
          </p>
        </div>
      </div>

      {/* Reservation status breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Desglose de Reservas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pendientes', value: stats.pendingReservations, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
            { label: 'Completadas', value: stats.completedReservations, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
            { label: 'Canceladas', value: stats.cancelledReservations, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
            { label: 'Total', value: stats.totalReservations, color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' },
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

      {/* ── Work Orders Section ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes de Trabajo — Resumen</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Estado operativo y métricas financieras del taller
        </p>
      </div>

      {/* Status overview card grid */}
      {woStats && (() => {
        const statusConfig: { key: keyof WorkOrderStats; label: string; dot: string }[] = [
          { key: 'OPEN',             label: 'Abiertas',          dot: 'bg-blue-500' },
          { key: 'DIAGNOSING',       label: 'En Diagnóstico',    dot: 'bg-amber-500' },
          { key: 'IN_REPAIR',        label: 'En Reparación',     dot: 'bg-cyan-500' },
          { key: 'PENDING_APPROVAL', label: 'Pend. Aprobación',  dot: 'bg-orange-500' },
          { key: 'COMPLETED',        label: 'Completadas',       dot: 'bg-green-500' },
          { key: 'INVOICED',         label: 'Facturadas',        dot: 'bg-purple-500' },
          { key: 'DELIVERED',        label: 'Entregadas',        dot: 'bg-emerald-500' },
          { key: 'CANCELLED',        label: 'Canceladas',        dot: 'bg-red-500' },
        ];
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {statusConfig.map(({ key, label, dot }) => (
              <div
                key={key}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2"
              >
                <span className={`w-3 h-3 rounded-full ${dot}`} />
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{woStats[key]}</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center">{label}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Financial summary row */}
      {(() => {
        const invoiced = woOrders.filter(o => o.status === 'INVOICED' || o.status === 'DELIVERED');
        const totalFacturado = invoiced.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

        const closedOrders = woOrders.filter(o =>
          o.status === 'COMPLETED' || o.status === 'INVOICED' || o.status === 'DELIVERED'
        );
        const avgPorOrden = closedOrders.length > 0
          ? Math.round(closedOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0) / closedOrders.length)
          : 0;

        const now = new Date();
        const ordenesMes = woOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Total Facturado
              </h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">${totalFacturado.toLocaleString()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Órdenes facturadas y entregadas
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Promedio por Orden
              </h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">${avgPorOrden.toLocaleString()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Completadas, facturadas y entregadas
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Órdenes este Mes
              </h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{ordenesMes}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Creadas en el mes actual
              </p>
            </div>
          </div>
        );
      })()}

      {/* Active orders table */}
      {(() => {
        const activeStatuses: WorkOrder['status'][] = ['OPEN', 'DIAGNOSING', 'IN_REPAIR', 'PENDING_APPROVAL'];
        const activeOrders = woOrders.filter(o => activeStatuses.includes(o.status));

        const statusBadge: Record<WorkOrder['status'], string> = {
          DRAFT:             'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
          OPEN:              'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
          DIAGNOSING:        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
          PENDING_APPROVAL:  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
          IN_REPAIR:         'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
          COMPLETED:         'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
          INVOICED:          'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
          DELIVERED:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
          CANCELLED:         'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        };

        const statusLabel: Record<WorkOrder['status'], string> = {
          DRAFT: 'Borrador', OPEN: 'Abierta', DIAGNOSING: 'En Diagnóstico',
          PENDING_APPROVAL: 'Pend. Aprobación', IN_REPAIR: 'En Reparación',
          COMPLETED: 'Completada', INVOICED: 'Facturada', DELIVERED: 'Entregada',
          CANCELLED: 'Cancelada',
        };

        const priorityLabel: Record<WorkOrder['priority'], string> = {
          LOW: 'Baja', NORMAL: 'Normal', HIGH: 'Alta', URGENT: 'Urgente',
        };

        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Órdenes Activas
            </h2>
            {activeOrders.length === 0 ? (
              <div className="text-center py-10">
                <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">No hay órdenes activas en este momento</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {['# Orden', 'Cliente', 'Vehículo', 'Técnico', 'Estado', 'Prioridad', 'Días abierta'].map(h => (
                        <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {activeOrders.map(order => {
                      const daysOpen = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 86400000);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                          <td className="py-3 px-2 font-mono text-slate-900 dark:text-white">{order.orderNumber}</td>
                          <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{order.clientName ?? '—'}</td>
                          <td className="py-3 px-2 text-slate-700 dark:text-slate-300">
                            {order.vehiclePlate ?? ''}{order.vehicleBrand ? ` · ${order.vehicleBrand}` : ''}
                            {order.vehicleModel ? ` ${order.vehicleModel}` : ''}
                          </td>
                          <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{order.technicianName ?? '—'}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[order.status]}`}>
                              {statusLabel[order.status]}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{priorityLabel[order.priority]}</td>
                          <td className={`py-3 px-2 font-semibold ${daysOpen > 7 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {daysOpen}d
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* Technician performance table */}
      {(() => {
        const closedStatuses: WorkOrder['status'][] = ['COMPLETED', 'INVOICED', 'DELIVERED'];
        const closed = woOrders.filter(o => closedStatuses.includes(o.status));

        const techMap = new Map<string, { name: string; count: number; total: number }>();
        closed.forEach(o => {
          const key = o.technicianId ?? 'unknown';
          const current = techMap.get(key) ?? { name: o.technicianName ?? `Técnico (${key.slice(-4)})`, count: 0, total: 0 };
          techMap.set(key, {
            name: current.name,
            count: current.count + 1,
            total: current.total + (o.totalAmount ?? 0),
          });
        });

        const techRows = Array.from(techMap.values()).sort((a, b) => b.total - a.total);

        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Rendimiento por Técnico
            </h2>
            {techRows.length === 0 ? (
              <div className="text-center py-10">
                <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400">No hay órdenes completadas aún</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {['Técnico', 'Órdenes completadas', 'Total facturado ($)'].map(h => (
                        <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {techRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="py-3 px-2 font-medium text-slate-900 dark:text-white">{row.name}</td>
                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{row.count}</td>
                        <td className="py-3 px-2 font-semibold text-green-600 dark:text-green-400">${row.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
