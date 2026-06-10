'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ClipboardList } from 'lucide-react';
import { workOrderApi, type WorkOrder } from '@/lib/api-client';
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

type TabKey = 'all' | 'active' | 'completed' | 'pending';

const ACTIVE_STATUSES: StatusKey[] = ['OPEN', 'DIAGNOSING', 'IN_REPAIR'];
const PENDING_STATUSES: StatusKey[] = ['PENDING_APPROVAL'];
const COMPLETED_STATUSES: StatusKey[] = ['COMPLETED', 'INVOICED', 'DELIVERED'];

function filterByTab(orders: WorkOrder[], tab: TabKey): WorkOrder[] {
  switch (tab) {
    case 'active':
      return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    case 'completed':
      return orders.filter((o) => COMPLETED_STATUSES.includes(o.status));
    case 'pending':
      return orders.filter((o) => PENDING_STATUSES.includes(o.status));
    default:
      return orders;
  }
}

export default function WasherMisOrdenesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'EMPLOYEE') {
      router.push('/dashboard');
      return;
    }
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await workOrderApi.getAll(token, { technicianId: user.id });
        setOrders(res.data);
      } catch {
        setToast({ isOpen: true, title: 'Error', message: 'No se pudieron cargar las órdenes', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user, token, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: orders.length },
    { key: 'active', label: 'Activas', count: filterByTab(orders, 'active').length },
    { key: 'pending', label: 'Pend. Aprobación', count: filterByTab(orders, 'pending').length },
    { key: 'completed', label: 'Completadas', count: filterByTab(orders, 'completed').length },
  ];

  const visible = filterByTab(orders, activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Órdenes</h1>
        <p className="text-slate-600 dark:text-slate-400">Órdenes de trabajo asignadas a vos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === t.key
                ? 'bg-cyan-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-600'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No hay órdenes en esta categoría</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"># Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prioridad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {visible.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/washer/mis-ordenes/${order.id}`)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
