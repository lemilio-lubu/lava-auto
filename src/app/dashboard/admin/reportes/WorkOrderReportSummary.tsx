import { Briefcase, Star } from 'lucide-react';
import type { WorkOrder, WorkOrderStats } from '@/lib/api-client';
import { WORK_ORDER_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants';

// CSS classes por estado para la tabla de órdenes activas (colores semánticos inline,
// no usa el componente Badge genérico porque aquí se necesita más control de padding).
const WORK_ORDER_STATUS_ROW_CLASSES: Record<WorkOrder['status'], string> = {
  DRAFT:            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  OPEN:             'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DIAGNOSING:       'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  IN_REPAIR:        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  COMPLETED:        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  INVOICED:         'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  DELIVERED:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CANCELLED:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const WO_STATUS_CONFIG: { key: keyof WorkOrderStats; label: string; dot: string }[] = [
  { key: 'OPEN',             label: 'Abiertas',         dot: 'bg-blue-500' },
  { key: 'DIAGNOSING',       label: 'En Diagnóstico',   dot: 'bg-amber-500' },
  { key: 'IN_REPAIR',        label: 'En Reparación',    dot: 'bg-cyan-500' },
  { key: 'PENDING_APPROVAL', label: 'Pend. Aprobación', dot: 'bg-orange-500' },
  { key: 'COMPLETED',        label: 'Completadas',      dot: 'bg-green-500' },
  { key: 'INVOICED',         label: 'Facturadas',       dot: 'bg-purple-500' },
  { key: 'DELIVERED',        label: 'Entregadas',       dot: 'bg-emerald-500' },
  { key: 'CANCELLED',        label: 'Canceladas',       dot: 'bg-red-500' },
];

const ACTIVE_STATUSES: WorkOrder['status'][] = ['OPEN', 'DIAGNOSING', 'IN_REPAIR', 'PENDING_APPROVAL'];
const CLOSED_STATUSES: WorkOrder['status'][] = ['COMPLETED', 'INVOICED', 'DELIVERED'];

interface WorkOrderReportSummaryProps {
  woStats: WorkOrderStats | null;
  woOrders: WorkOrder[];
}

export default function WorkOrderReportSummary({ woStats, woOrders }: WorkOrderReportSummaryProps) {
  const activeOrders = woOrders.filter(o => ACTIVE_STATUSES.includes(o.status));

  const closedOrders = woOrders.filter(o => CLOSED_STATUSES.includes(o.status));
  const invoicedOrders = woOrders.filter(o => o.status === 'INVOICED' || o.status === 'DELIVERED');
  const totalFacturado = invoicedOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  const avgPorOrden = closedOrders.length > 0
    ? Math.round(closedOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0) / closedOrders.length)
    : 0;

  const now = new Date();
  const ordenesMes = woOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const techMap = new Map<string, { name: string; count: number; total: number }>();
  closedOrders.forEach(o => {
    const key = o.technicianId ?? 'unknown';
    const current = techMap.get(key) ?? { name: o.technicianName ?? `Técnico (${key.slice(-4)})`, count: 0, total: 0 };
    techMap.set(key, { name: current.name, count: current.count + 1, total: current.total + (o.totalAmount ?? 0) });
  });
  const techRows = Array.from(techMap.values()).sort((a, b) => b.total - a.total);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes de Trabajo — Resumen</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Estado operativo y métricas financieras del taller
        </p>
      </div>

      {/* Status overview */}
      {woStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {WO_STATUS_CONFIG.map(({ key, label, dot }) => (
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
      )}

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Facturado</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">${totalFacturado.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Órdenes facturadas y entregadas</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Promedio por Orden</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">${avgPorOrden.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completadas, facturadas y entregadas</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Órdenes del Mes</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{ordenesMes}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Creadas en el mes actual</p>
        </div>
      </div>

      {/* Active orders table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Órdenes Activas</h2>
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
                  const daysOpen = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / 86400000);
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
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${WORK_ORDER_STATUS_ROW_CLASSES[order.status]}`}>
                          {WORK_ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-700 dark:text-slate-300">{PRIORITY_LABELS[order.priority]}</td>
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

      {/* Technician performance */}
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
    </>
  );
}
