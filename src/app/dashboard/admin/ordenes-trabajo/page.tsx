'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Eye } from 'lucide-react';
import { workOrderApi, type WorkOrder, type WorkOrderStats } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Toast from '@/components/ui/Toast';

type StatusKey = WorkOrder['status'];
type PriorityKey = WorkOrder['priority'];

const STATUS_LABELS: Record<StatusKey, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierta',
  DIAGNOSING: 'Diagnóstico',
  PENDING_APPROVAL: 'Pend. Aprobación',
  IN_REPAIR: 'En Reparación',
  COMPLETED: 'Completada',
  INVOICED: 'Facturada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};

const STATUS_VARIANT: Record<StatusKey, 'neutral' | 'info' | 'warning' | 'error' | 'primary' | 'success'> = {
  DRAFT: 'neutral',
  OPEN: 'info',
  DIAGNOSING: 'warning',
  PENDING_APPROVAL: 'warning',
  IN_REPAIR: 'primary',
  COMPLETED: 'success',
  INVOICED: 'success',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const PRIORITY_LABELS: Record<PriorityKey, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const PRIORITY_VARIANT: Record<PriorityKey, 'neutral' | 'info' | 'warning' | 'error'> = {
  LOW: 'neutral',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as StatusKey[];

export default function OrdenesTrabajoPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [user, token, authLoading, router]);

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        workOrderApi.getAll(token),
        workOrderApi.getStats(token),
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch {
      setToast({ isOpen: true, title: 'Error', message: 'No se pudieron cargar las órdenes', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const q = search.toLowerCase();
    const matchesSearch = q
      ? o.orderNumber.toLowerCase().includes(q) || (o.clientName ?? '').toLowerCase().includes(q)
      : true;
    return matchesStatus && matchesSearch;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Órdenes de Trabajo</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestión del taller mecánico</p>
        </div>
        <Button onClick={() => router.push('/dashboard/admin/ordenes-trabajo/nueva')}>
          <Plus className="w-5 h-5" />
          Nueva Orden
        </Button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`bg-white dark:bg-slate-800 rounded-xl p-3 border text-center transition-all hover:shadow-md ${
                statusFilter === s
                  ? 'border-cyan-500 ring-2 ring-cyan-300 dark:ring-cyan-700'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats[s] ?? 0}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{STATUS_LABELS[s]}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar por # orden o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"># Orden</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Técnico</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/admin/ordenes-trabajo/${order.id}`)}
                >
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                    {order.clientName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{order.vehiclePlate ?? '—'}</span>
                    {order.vehicleBrand && (
                      <span className="text-slate-500 dark:text-slate-400 ml-1">
                        {order.vehicleBrand} {order.vehicleModel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {order.technicianName ?? <span className="text-slate-400 italic">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={PRIORITY_VARIANT[order.priority]} size="sm">
                      {PRIORITY_LABELS[order.priority]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/admin/ordenes-trabajo/${order.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No hay órdenes que coincidan con los filtros</p>
          </div>
        )}
      </div>

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}
