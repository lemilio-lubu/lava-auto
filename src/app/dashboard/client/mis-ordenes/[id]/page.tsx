'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import { workOrderApi, type WorkOrder, type WorkOrderPhoto } from '@/lib/api-client';
import Badge from '@/components/ui/Badge';
import Toast from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusKey = WorkOrder['status'];

type ToastState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

const DOT_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-400',
  OPEN: 'bg-blue-500',
  DIAGNOSING: 'bg-amber-500',
  PENDING_APPROVAL: 'bg-orange-500',
  IN_REPAIR: 'bg-cyan-500',
  COMPLETED: 'bg-green-500',
  INVOICED: 'bg-purple-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

const PHOTO_TYPE_LABELS: Record<WorkOrderPhoto['photoType'], string> = {
  BEFORE: 'Antes',
  DURING: 'Durante',
  AFTER: 'Después',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
        {value || <span className="italic text-slate-400">—</span>}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientOrderDetailPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ isOpen: false, title: '', message: '', type: 'info' });

  const showToast = useCallback((t: Omit<ToastState, 'isOpen'>) => {
    setToast({ ...t, isOpen: true });
  }, []);

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
        const res = await workOrderApi.getById(params.id, token);
        if (res.data.clientId !== user.id) {
          router.push('/dashboard/client/mis-ordenes');
          return;
        }
        setWorkOrder(res.data);
      } catch {
        showToast({ title: 'Error', message: 'No se pudo cargar la orden', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user, token, authLoading, router, params.id, showToast]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 dark:text-slate-400">Orden no encontrada</p>
      </div>
    );
  }

  const laborTotal = (workOrder.labor ?? []).reduce((s, l) => s + l.subtotal, 0);
  const partsTotal = (workOrder.parts ?? []).reduce((s, p) => s + p.subtotal, 0);

  const statusEvents = [...(workOrder.statusHistory ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <button
          onClick={() => router.push('/dashboard/client/mis-ordenes')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis órdenes
        </button>

        {/* Header card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {workOrder.orderNumber}
              </h1>
              <Badge variant={STATUS_VARIANT[workOrder.status]}>{STATUS_LABELS[workOrder.status]}</Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
              <span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Vehículo:</span>{' '}
                {workOrder.vehiclePlate ?? '—'}
                {workOrder.vehicleBrand && ` ${workOrder.vehicleBrand} ${workOrder.vehicleModel ?? ''}`}
              </span>
              <span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Técnico:</span>{' '}
                {workOrder.technicianName ?? <em>Sin asignar</em>}
              </span>
              {workOrder.mileage != null && (
                <span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Km:</span>{' '}
                  {workOrder.mileage.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Creada: {fmtDate(workOrder.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Problem description */}
      <SectionCard title="Descripción del problema">
        <TextBlock label="Lo que reportaste" value={workOrder.problemDescription} />
      </SectionCard>

      {/* Diagnosis */}
      <SectionCard title="Diagnóstico y recomendaciones">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextBlock label="Diagnóstico" value={workOrder.diagnosis} />
          <TextBlock label="Recomendaciones" value={workOrder.recommendations} />
        </div>
      </SectionCard>

      {/* Labor summary */}
      {(workOrder.labor ?? []).length > 0 && (
        <SectionCard title="Mano de obra">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-2 pr-4">Descripción</th>
                  <th className="text-right py-2 pr-4">Horas</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {(workOrder.labor ?? []).map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-4 text-slate-900 dark:text-white">{l.description}</td>
                    <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">{l.hours}</td>
                    <td className="py-2 text-right font-medium text-slate-900 dark:text-white">{fmt(l.subtotal)}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={2} className="py-2 pr-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Subtotal mano de obra
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">{fmt(laborTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Parts summary */}
      {(workOrder.parts ?? []).length > 0 && (
        <SectionCard title="Repuestos y materiales">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-2 pr-4">Descripción</th>
                  <th className="text-right py-2 pr-4">Cantidad</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {(workOrder.parts ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 text-slate-900 dark:text-white">{p.description}</td>
                    <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">{p.quantity}</td>
                    <td className="py-2 text-right font-medium text-slate-900 dark:text-white">{fmt(p.subtotal)}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={2} className="py-2 pr-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Subtotal repuestos
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">{fmt(partsTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Total amount */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-slate-900 dark:text-white">Total del servicio</span>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(workOrder.totalAmount)}</span>
        </div>
      </div>

      {/* Photos */}
      {(workOrder.photos ?? []).length > 0 && (
        <SectionCard title="Fotos del servicio">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(workOrder.photos ?? []).map((p) => (
              <div key={p.id} className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={p.photoUrl}
                  alt={p.description ?? p.photoType}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2">
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mb-1">
                    {PHOTO_TYPE_LABELS[p.photoType]}
                  </span>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{p.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Status history */}
      <SectionCard title="Historial de estados">
        {statusEvents.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin historial</p>
        ) : (
          <ol className="relative border-l border-slate-200 dark:border-slate-700 space-y-6 ml-3">
            {statusEvents.map((ev) => (
              <li key={ev.id} className="relative pl-6">
                <span
                  className={`absolute -left-2 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${DOT_COLOR[ev.toStatus] ?? 'bg-slate-400'}`}
                />
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {ev.fromStatus ? (
                    <>
                      <span className="text-slate-500 dark:text-slate-400">
                        {STATUS_LABELS[ev.fromStatus as StatusKey] ?? ev.fromStatus}
                      </span>
                      {' → '}
                    </>
                  ) : null}
                  <span>{STATUS_LABELS[ev.toStatus as StatusKey] ?? ev.toStatus}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {fmtDate(ev.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

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
