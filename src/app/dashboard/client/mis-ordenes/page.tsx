'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ClipboardList } from 'lucide-react';
import { workOrderApi, type WorkOrder } from '@/lib/api-client';
import Badge from '@/components/ui/Badge';
import Toast from '@/components/ui/Toast';

type StatusKey = WorkOrder['status'];

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

export default function ClientMisOrdenesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'CLIENT') {
      router.push('/dashboard');
      return;
    }
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await workOrderApi.getAll(token, { clientId: user.id });
        setOrders(res.data);
      } catch {
        setToast({ isOpen: true, title: 'Error', message: 'No se pudieron cargar tus órdenes', type: 'error' });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Órdenes de Taller</h1>
        <p className="text-slate-600 dark:text-slate-400">Historial de servicios técnicos de tus vehículos</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Aún no tenés órdenes de servicio registradas</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"># Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Técnico</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/client/mis-ordenes/${order.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                      {order.orderNumber}
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
