'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Pencil, Clock } from 'lucide-react';
import { workOrderApi, type WorkOrder, type WorkOrderPhoto } from '@/lib/api-client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
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

const INPUT_CLASS =
  'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
const LABEL_CLASS =
  'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

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

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        {action}
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

// ─── DiagnosisEditSection ─────────────────────────────────────────────────────

interface DiagnosisEditSectionProps {
  workOrder: WorkOrder;
  token: string;
  onRefresh: () => void;
  showToast: (t: Omit<ToastState, 'isOpen'>) => void;
}

function DiagnosisEditSection({ workOrder, token, onRefresh, showToast }: DiagnosisEditSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    diagnosis: workOrder.diagnosis ?? '',
    recommendations: workOrder.recommendations ?? '',
  });

  function openModal() {
    setForm({
      diagnosis: workOrder.diagnosis ?? '',
      recommendations: workOrder.recommendations ?? '',
    });
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await workOrderApi.update(workOrder.id, form, token);
      showToast({ title: 'Guardado', message: 'Diagnóstico actualizado', type: 'success' });
      onRefresh();
      setOpen(false);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo guardar el diagnóstico', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionCard
        title="Diagnóstico y recomendaciones"
        action={
          <Button size="sm" variant="outline" onClick={openModal}>
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextBlock label="Descripción del problema (cliente)" value={workOrder.problemDescription} />
          <TextBlock label="Diagnóstico" value={workOrder.diagnosis} />
          <TextBlock label="Recomendaciones" value={workOrder.recommendations} />
        </div>
      </SectionCard>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editar diagnóstico</h3>

          <div>
            <label className={LABEL_CLASS}>Diagnóstico</label>
            <textarea
              rows={4}
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              className={INPUT_CLASS}
              placeholder="Describe el diagnóstico técnico..."
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Recomendaciones</label>
            <textarea
              rows={3}
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
              className={INPUT_CLASS}
              placeholder="Recomendaciones para el cliente..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WasherOrderDetailPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ isOpen: false, title: '', message: '', type: 'info' });

  const showToast = useCallback((t: Omit<ToastState, 'isOpen'>) => {
    setToast({ ...t, isOpen: true });
  }, []);

  const loadWorkOrder = useCallback(async () => {
    if (!token) return;
    try {
      const res = await workOrderApi.getById(params.id, token);
      setWorkOrder(res.data);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo cargar la orden', type: 'error' });
    }
  }, [params.id, token, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'EMPLOYEE') {
      router.push('/dashboard');
      return;
    }
    if (!token) return;

    const init = async () => {
      setIsLoading(true);
      try {
        const res = await workOrderApi.getById(params.id, token);
        if (res.data.technicianId !== user.id) {
          router.push('/dashboard/washer/mis-ordenes');
          return;
        }
        setWorkOrder(res.data);
      } catch {
        showToast({ title: 'Error', message: 'No se pudieron cargar los datos', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    init();
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

  const statusEvents = [...(workOrder.statusHistory ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <button
          onClick={() => router.push('/dashboard/washer/mis-ordenes')}
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
                <span className="font-medium text-slate-700 dark:text-slate-300">Cliente:</span>{' '}
                {workOrder.clientName ?? '—'}
              </span>
              <span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Vehículo:</span>{' '}
                {workOrder.vehiclePlate ?? '—'}
                {workOrder.vehicleBrand && ` ${workOrder.vehicleBrand} ${workOrder.vehicleModel ?? ''}`}
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

      {/* Diagnosis (editable) */}
      <DiagnosisEditSection
        workOrder={workOrder}
        token={token!}
        onRefresh={loadWorkOrder}
        showToast={showToast}
      />

      {/* Labor — read-only */}
      <SectionCard title="Mano de obra">
        {(workOrder.labor ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin líneas de mano de obra</p>
        ) : (
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
                    <td className="py-2 text-right font-medium text-slate-900 dark:text-white">
                      {fmt(l.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Parts — read-only */}
      <SectionCard title="Repuestos y materiales">
        {(workOrder.parts ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin repuestos registrados</p>
        ) : (
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
                    <td className="py-2 text-right font-medium text-slate-900 dark:text-white">
                      {fmt(p.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Photos — read-only */}
      {(workOrder.photos ?? []).length > 0 && (
        <SectionCard title="Fotos">
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
                {ev.changedBy && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Por: {ev.changedBy}</p>
                )}
                {ev.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 italic">"{ev.notes}"</p>
                )}
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
