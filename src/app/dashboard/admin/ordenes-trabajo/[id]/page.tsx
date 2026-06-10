'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Clock,
  FileText,
  Check,
} from 'lucide-react';
import {
  workOrderApi,
  adminApi,
  catalogApi,
  serviceApi,
  type WorkOrder,
  type WorkOrderService,
  type WorkOrderLaborLine,
  type WorkOrderPartLine,
  type WorkOrderPhoto,
  type LaborRate,
  type SparePart,
  type Service,
  type User,
} from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';
import {
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_VARIANTS,
  PRIORITY_LABELS,
  PRIORITY_VARIANTS,
} from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusKey = WorkOrder['status'];
type PriorityKey = WorkOrder['priority'];

type ToastState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NEXT_STATUSES: Partial<Record<StatusKey, StatusKey[]>> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['DIAGNOSING', 'CANCELLED'],
  DIAGNOSING: ['PENDING_APPROVAL', 'IN_REPAIR', 'CANCELLED'],
  PENDING_APPROVAL: ['IN_REPAIR', 'CANCELLED'],
  IN_REPAIR: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['INVOICED'],
  INVOICED: ['DELIVERED'],
};

const STATUS_STEPS: StatusKey[] = [
  'DRAFT', 'OPEN', 'DIAGNOSING', 'PENDING_APPROVAL',
  'IN_REPAIR', 'COMPLETED', 'INVOICED', 'DELIVERED',
];

const STEP_LABELS: Record<string, string> = {
  DRAFT: 'Borrador', OPEN: 'Abierta', DIAGNOSING: 'Diagnóst.',
  PENDING_APPROVAL: 'Aprobac.', IN_REPAIR: 'Reparac.',
  COMPLETED: 'Lista', INVOICED: 'Facturada', DELIVERED: 'Entregada', CANCELLED: 'Cancelada',
};

const ADVANCE_LABELS: Partial<Record<StatusKey, string>> = {
  OPEN: 'Abrir orden',
  DIAGNOSING: 'Iniciar diagnóstico',
  PENDING_APPROVAL: 'Enviar a aprobación',
  IN_REPAIR: 'Iniciar reparación',
  COMPLETED: 'Marcar completada',
  INVOICED: 'Facturar',
  DELIVERED: 'Marcar entregada',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
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

// ─── StatusStepper ────────────────────────────────────────────────────────────

function StatusStepper({ currentStatus }: { currentStatus: StatusKey }) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <span className="text-sm font-medium text-red-700 dark:text-red-400">Orden cancelada — estado terminal</span>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
      <div className="flex items-start" style={{ minWidth: 480 }}>
        {STATUS_STEPS.map((step, idx) => {
          const isDone   = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isNext   = idx === currentIdx + 1;

          return (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`absolute top-3 left-1/2 w-full h-0.5 ${
                    isDone ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isDone
                    ? 'bg-teal-500 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white'
                    : isNext
                    ? 'bg-white dark:bg-slate-800 text-blue-500 border-2 border-blue-400 border-dashed'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-center leading-tight ${
                  isActive
                    ? 'text-xs font-semibold text-blue-600 dark:text-blue-400'
                    : isDone
                    ? 'text-xs text-teal-600 dark:text-teal-400'
                    : 'text-xs text-slate-400 dark:text-slate-500'
                }`}
                style={{ maxWidth: 56 }}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ServicesSection ──────────────────────────────────────────────────────────

interface ServicesSectionProps {
  workOrder: WorkOrder;
  token: string;
  services: Service[];
  onRefresh: () => void;
  showToast: (t: Omit<ToastState, 'isOpen'>) => void;
}

function ServicesSection({ workOrder, token, services, onRefresh, showToast }: ServicesSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [preview, setPreview] = useState<Service | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const woServices = workOrder.services ?? [];

  async function handleServiceChange(id: string) {
    setServiceId(id);
    setPreview(null);
    if (!id) return;
    setLoadingPreview(true);
    try {
      const full = await serviceApi.getById(id, token);
      setPreview(full);
    } catch {
      // sin preview — igual se puede agregar
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleAdd() {
    if (!serviceId) return;
    setSaving(true);
    try {
      await workOrderApi.addService(workOrder.id, { serviceId }, token);
      showToast({ title: 'Servicio agregado', message: 'Mano de obra y repuestos aplicados', type: 'success' });
      onRefresh();
      setOpen(false);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo agregar el servicio', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirmDeleteId) return;
    const idToDelete = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await workOrderApi.removeService(workOrder.id, idToDelete, token);
      showToast({ title: 'Eliminado', message: 'Servicio eliminado', type: 'success' });
      onRefresh();
    } catch {
      showToast({ title: 'Error', message: 'No se pudo eliminar el servicio', type: 'error' });
    }
  }

  function laborTotal(svc: WorkOrderService) {
    return (svc.labor ?? []).reduce((s, l) => s + l.subtotal, 0);
  }
  function partsTotal(svc: WorkOrderService) {
    return (svc.parts ?? []).reduce((s, p) => s + p.subtotal, 0);
  }

  return (
    <>
      <SectionCard
        title="Servicios"
        action={
          <Button size="sm" onClick={() => {
            setServiceId('');
            setPreview(null);
            setOpen(true);
          }}>
            <Plus className="w-4 h-4" />
            Agregar servicio
          </Button>
        }
      >
        {woServices.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">Sin servicios asociados</p>
        ) : (
          <div className="space-y-3">
            {woServices.map((svc: WorkOrderService) => (
              <div key={svc.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{svc.name}</p>
                    {svc.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{svc.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                      <span>{svc.labor?.length ?? 0} tarea(s) de mano de obra</span>
                      <span>·</span>
                      <span>{svc.parts?.length ?? 0} repuesto(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {fmt(svc.basePrice + laborTotal(svc) + partsTotal(svc))}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(svc.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      aria-label="Eliminar servicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">¿Eliminar servicio?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Las líneas de mano de obra y repuestos asociadas quedarán sin agrupar.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
            <Button onClick={handleRemove}>Eliminar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Agregar servicio</h3>

          <div>
            <label className={LABEL_CLASS}>Servicio</label>
            <select
              value={serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Seleccionar servicio...</option>
              {services.filter((s) => s.isActive).map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)}</option>
              ))}
            </select>
          </div>

          {loadingPreview && (
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando servicio...
            </p>
          )}

          {preview && ((preview.laborItems?.length ?? 0) > 0 || (preview.partItems?.length ?? 0) > 0) && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-sm space-y-2">
              <p className="font-medium text-slate-700 dark:text-slate-300">Se agregarán automáticamente:</p>
              {(preview.laborItems?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mano de obra</p>
                  {preview.laborItems!.map((li, idx) => (
                    <div key={li.id ?? idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{li.laborRateName ?? 'Mano de obra'} · {li.hours}h</span>
                      <span className="text-slate-400">{fmt(li.subtotal ?? (li.hours * (li.ratePerHour ?? 0)))}</span>
                    </div>
                  ))}
                </div>
              )}
              {(preview.partItems?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Repuestos</p>
                  {preview.partItems!.map((pi, idx) => (
                    <div key={pi.id ?? idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{pi.sparePartName ?? 'Repuesto'} · ×{pi.quantity}</span>
                      <span className="text-slate-400">{fmt(pi.subtotal ?? (pi.quantity * (pi.unitPrice ?? 0)))}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Total servicio</span>
                <span>{fmt(preview.price)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} isLoading={saving} disabled={!serviceId}>Agregar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── DiagnosisSection ─────────────────────────────────────────────────────────

interface DiagnosisSectionProps {
  workOrder: WorkOrder;
  token: string;
  onRefresh: () => void;
  showToast: (t: Omit<ToastState, 'isOpen'>) => void;
}

function DiagnosisSection({ workOrder, token, onRefresh, showToast }: DiagnosisSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    problemDescription: workOrder.problemDescription ?? '',
    diagnosis: workOrder.diagnosis ?? '',
    recommendations: workOrder.recommendations ?? '',
    internalNotes: workOrder.internalNotes ?? '',
  });

  function openModal() {
    setForm({
      problemDescription: workOrder.problemDescription ?? '',
      diagnosis: workOrder.diagnosis ?? '',
      recommendations: workOrder.recommendations ?? '',
      internalNotes: workOrder.internalNotes ?? '',
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
        title="Diagnóstico"
        action={
          <Button size="sm" variant="outline" onClick={openModal}>
            <Pencil className="w-4 h-4" />
            Editar diagnóstico
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TextBlock label="Descripción del problema" value={workOrder.problemDescription} />
          <TextBlock label="Diagnóstico" value={workOrder.diagnosis} />
          <TextBlock label="Recomendaciones" value={workOrder.recommendations} />
          <TextBlock label="Notas internas" value={workOrder.internalNotes} />
        </div>
      </SectionCard>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editar diagnóstico</h3>
          {(['problemDescription', 'diagnosis', 'recommendations', 'internalNotes'] as const).map((field) => {
            const labels: Record<typeof field, string> = {
              problemDescription: 'Descripción del problema',
              diagnosis: 'Diagnóstico',
              recommendations: 'Recomendaciones',
              internalNotes: 'Notas internas',
            };
            return (
              <div key={field}>
                <label className={LABEL_CLASS}>{labels[field]}</label>
                <textarea
                  rows={3}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
            );
          })}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── LaborSection ─────────────────────────────────────────────────────────────

interface LaborSectionProps {
  workOrder: WorkOrder;
  token: string;
  employees: User[];
  laborRates: LaborRate[];
  onRefresh: () => void;
  showToast: (t: Omit<ToastState, 'isOpen'>) => void;
}

type LaborForm = {
  laborRateId: string;
  description: string;
  hours: number;
  ratePerHour: number;
  technicianId: string;
};

function LaborSection({ workOrder, token, employees, laborRates, onRefresh, showToast }: LaborSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LaborForm>({
    laborRateId: '',
    description: '',
    hours: 1,
    ratePerHour: 0,
    technicianId: '',
  });

  const lines = workOrder.labor ?? [];

  function openAdd() {
    setEditingId(null);
    setForm({ laborRateId: '', description: '', hours: 1, ratePerHour: 0, technicianId: '' });
    setOpen(true);
  }

  function openEdit(line: WorkOrderLaborLine) {
    setEditingId(line.id);
    setForm({
      laborRateId: line.laborRateId ?? '',
      description: line.description,
      hours: line.hours,
      ratePerHour: line.ratePerHour,
      technicianId: line.technicianId ?? '',
    });
    setOpen(true);
  }

  function handleRateChange(rateId: string) {
    const rate = laborRates.find((r) => r.id === rateId);
    setForm((f) => ({
      ...f,
      laborRateId: rateId,
      ratePerHour: rate ? rate.ratePerHour : f.ratePerHour,
      description: rate && !f.description ? rate.name : f.description,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Partial<WorkOrderLaborLine> = {
        description: form.description,
        hours: form.hours,
        ratePerHour: form.ratePerHour,
        ...(form.laborRateId && { laborRateId: form.laborRateId }),
        ...(form.technicianId && { technicianId: form.technicianId }),
      };
      if (editingId) {
        await workOrderApi.updateLaborLine(workOrder.id, editingId, payload, token);
      } else {
        await workOrderApi.addLaborLine(workOrder.id, payload, token);
      }
      showToast({ title: 'Guardado', message: 'Línea de mano de obra actualizada', type: 'success' });
      onRefresh();
      setOpen(false);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo guardar la línea', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lineId: string) {
    if (!confirm('¿Eliminar esta línea de mano de obra?')) return;
    try {
      await workOrderApi.deleteLaborLine(workOrder.id, lineId, token);
      showToast({ title: 'Eliminado', message: 'Línea eliminada', type: 'success' });
      onRefresh();
    } catch {
      showToast({ title: 'Error', message: 'No se pudo eliminar la línea', type: 'error' });
    }
  }

  return (
    <>
      <SectionCard
        title="Mano de Obra"
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        }
      >
        {lines.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin líneas de mano de obra</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-2 pr-4">Descripción</th>
                  <th className="text-left py-2 pr-4">Técnico</th>
                  <th className="text-right py-2 pr-4">Horas</th>
                  <th className="text-right py-2 pr-4">Tarifa/h</th>
                  <th className="text-right py-2 pr-4">Subtotal</th>
                  <th className="text-right py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {lines.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2 pr-4 text-slate-900 dark:text-white">{l.description}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                      {employees.find((e) => e.id === l.technicianId)?.name ?? <span className="italic text-slate-400">—</span>}
                    </td>
                    <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">{l.hours}</td>
                    <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">{fmt(l.ratePerHour)}</td>
                    <td className="py-2 pr-4 text-right font-medium text-slate-900 dark:text-white">{fmt(l.subtotal)}</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(l)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Editar mano de obra' : 'Agregar mano de obra'}
          </h3>

          <div>
            <label className={LABEL_CLASS}>Tarifa de mano de obra</label>
            <select
              value={form.laborRateId}
              onChange={(e) => handleRateChange(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Seleccionar tarifa...</option>
              {laborRates.filter((r) => r.isActive).map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {fmt(r.ratePerHour)}/h</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Descripción *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Horas *</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: parseFloat(e.target.value) || 0 })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Tarifa/hora *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.ratePerHour}
                onChange={(e) => setForm({ ...form, ratePerHour: parseFloat(e.target.value) || 0 })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Técnico</label>
            <select
              value={form.technicianId}
              onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="">Sin asignar</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 text-right">
            Subtotal estimado: <span className="font-semibold text-slate-900 dark:text-white">{fmt(form.hours * form.ratePerHour)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving} disabled={!form.description}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── PartsSection ─────────────────────────────────────────────────────────────

interface PartsSectionProps {
  workOrder: WorkOrder;
  token: string;
  spareParts: SparePart[];
  onRefresh: () => void;
  showToast: (t: Omit<ToastState, 'isOpen'>) => void;
}

type PartForm = {
  sparePartId: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

function PartsSection({ workOrder, token, spareParts, onRefresh, showToast }: PartsSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartForm>({
    sparePartId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  const lines = workOrder.parts ?? [];

  function openAdd() {
    setEditingId(null);
    setForm({ sparePartId: '', description: '', quantity: 1, unitPrice: 0 });
    setOpen(true);
  }

  function openEdit(line: WorkOrderPartLine) {
    setEditingId(line.id);
    setForm({
      sparePartId: line.sparePartId ?? '',
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    });
    setOpen(true);
  }

  function handlePartChange(partId: string) {
    const part = spareParts.find((p) => p.id === partId);
    setForm((f) => ({
      ...f,
      sparePartId: partId,
      unitPrice: part ? part.unitPrice : f.unitPrice,
      description: part && !f.description ? part.name : f.description,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Partial<WorkOrderPartLine> = {
        description: form.description,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        ...(form.sparePartId && { sparePartId: form.sparePartId }),
      };
      if (editingId) {
        await workOrderApi.updatePartLine(workOrder.id, editingId, payload, token);
      } else {
        await workOrderApi.addPartLine(workOrder.id, payload, token);
      }
      showToast({ title: 'Guardado', message: 'Repuesto actualizado', type: 'success' });
      onRefresh();
      setOpen(false);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo guardar el repuesto', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lineId: string) {
    if (!confirm('¿Eliminar este repuesto?')) return;
    try {
      await workOrderApi.deletePartLine(workOrder.id, lineId, token);
      showToast({ title: 'Eliminado', message: 'Repuesto eliminado', type: 'success' });
      onRefresh();
    } catch {
      showToast({ title: 'Error', message: 'No se pudo eliminar el repuesto', type: 'error' });
    }
  }

  return (
    <>
      <SectionCard
        title="Repuestos y Materiales"
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        }
      >
        {lines.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin repuestos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-2 pr-4">Descripción</th>
                  <th className="text-right py-2 pr-4">Cant.</th>
                  <th className="text-right py-2 pr-4">Precio Unit.</th>
                  <th className="text-right py-2 pr-4">Subtotal</th>
                  <th className="text-right py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {lines.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2 pr-4 text-slate-900 dark:text-white">{l.description}</td>
                    <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">{l.quantity}</td>
                    <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-300">{fmt(l.unitPrice)}</td>
                    <td className="py-2 pr-4 text-right font-medium text-slate-900 dark:text-white">{fmt(l.subtotal)}</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(l)}
                          className="p-1 rounded text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Editar repuesto' : 'Agregar repuesto'}
          </h3>

          <div>
            <label className={LABEL_CLASS}>Repuesto del catálogo</label>
            <select
              value={form.sparePartId}
              onChange={(e) => handlePartChange(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Seleccionar repuesto...</option>
              {spareParts.filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {fmt(p.unitPrice)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Descripción *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Cantidad *</label>
              <input
                type="number"
                min={0}
                step={0.001}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Precio unitario *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 text-right">
            Subtotal estimado: <span className="font-semibold text-slate-900 dark:text-white">{fmt(form.quantity * form.unitPrice)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} isLoading={saving} disabled={!form.description}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── CostSummarySection ───────────────────────────────────────────────────────

interface CostSummarySectionProps {
  workOrder: WorkOrder;
  token: string;
  onRefresh: () => void;
  showToast: (t: Omit<ToastState, 'isOpen'>) => void;
}

function CostSummarySection({ workOrder, token, onRefresh, showToast }: CostSummarySectionProps) {
  const [discount, setDiscount] = useState(workOrder.discountAmount);
  const [tax, setTax] = useState(workOrder.taxAmount);
  const [saving, setSaving] = useState(false);

  const laborTotal    = (workOrder.labor ?? []).reduce((s, l) => s + l.subtotal, 0);
  const partsTotal    = (workOrder.parts ?? []).reduce((s, p) => s + p.subtotal, 0);
  const servicesTotal = workOrder.servicesAmount ?? 0;
  const subtotal      = servicesTotal + laborTotal + partsTotal;
  const total         = subtotal - discount + tax;

  async function handleSave() {
    setSaving(true);
    try {
      await workOrderApi.update(workOrder.id, { discountAmount: discount, taxAmount: tax }, token);
      showToast({ title: 'Guardado', message: 'Costos actualizados', type: 'success' });
      onRefresh();
    } catch {
      showToast({ title: 'Error', message: 'No se pudieron guardar los costos', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Resumen de Costos">
      <div className="space-y-3 max-w-sm ml-auto">
        {servicesTotal > 0 && (
          <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
            <span>Servicios</span>
            <span>{fmt(servicesTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>Mano de obra</span>
          <span>{fmt(laborTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
          <span>Repuestos</span>
          <span>{fmt(partsTotal)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">Descuento ($)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm text-right"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">Impuesto ($)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={tax}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm text-right"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
          <span className="text-base font-semibold text-slate-900 dark:text-white">Total</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(total)}</span>
        </div>

        <div className="pt-2">
          <Button fullWidth onClick={handleSave} isLoading={saving}>
            Guardar costos
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── PhotosSection ────────────────────────────────────────────────────────────

interface PhotosSectionProps {
  workOrder: WorkOrder;
  token: string;
  onRefresh: () => void;
  showToast: (t: Omit<ToastState, 'isOpen'>) => void;
}

type PhotoForm = {
  photoUrl: string;
  photoType: WorkOrderPhoto['photoType'];
  description: string;
};

const PHOTO_TYPE_LABELS: Record<WorkOrderPhoto['photoType'], string> = {
  BEFORE: 'Antes',
  DURING: 'Durante',
  AFTER: 'Después',
};

function PhotosSection({ workOrder, token, onRefresh, showToast }: PhotosSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PhotoForm>({ photoUrl: '', photoType: 'BEFORE', description: '' });

  const photos = workOrder.photos ?? [];

  function openAdd() {
    setForm({ photoUrl: '', photoType: 'BEFORE', description: '' });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.photoUrl.trim()) {
      showToast({ title: 'Error', message: 'La URL de la foto es requerida', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await workOrderApi.addPhoto(workOrder.id, form, token);
      showToast({ title: 'Guardado', message: 'Foto agregada', type: 'success' });
      onRefresh();
      setOpen(false);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo agregar la foto', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await workOrderApi.deletePhoto(workOrder.id, photoId, token);
      showToast({ title: 'Eliminado', message: 'Foto eliminada', type: 'success' });
      onRefresh();
    } catch {
      showToast({ title: 'Error', message: 'No se pudo eliminar la foto', type: 'error' });
    }
  }

  return (
    <>
      <SectionCard
        title="Fotos"
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Agregar foto
          </Button>
        }
      >
        {photos.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin fotos registradas</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group relative">
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
                <button
                  onClick={() => handleDelete(p.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Eliminar foto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Agregar foto</h3>

          <div>
            <label className={LABEL_CLASS}>URL de la foto *</label>
            <input
              type="text"
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              placeholder="https://..."
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Tipo</label>
            <select
              value={form.photoType}
              onChange={(e) => setForm({ ...form, photoType: e.target.value as WorkOrderPhoto['photoType'] })}
              className={INPUT_CLASS}
            >
              {(Object.keys(PHOTO_TYPE_LABELS) as WorkOrderPhoto['photoType'][]).map((t) => (
                <option key={t} value={t}>{PHOTO_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={INPUT_CLASS}
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

// ─── StatusHistorySection ─────────────────────────────────────────────────────

function StatusHistorySection({ workOrder }: { workOrder: WorkOrder }) {
  const events = [...(workOrder.statusHistory ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const dotColor: Record<string, string> = {
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

  return (
    <SectionCard title="Historial de estados">
      {events.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Sin historial</p>
      ) : (
        <ol className="relative border-l border-slate-200 dark:border-slate-700 space-y-6 ml-3">
          {events.map((ev) => (
            <li key={ev.id} className="relative pl-6">
              <span
                className={`absolute -left-2 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${dotColor[ev.toStatus] ?? 'bg-slate-400'}`}
              />
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {ev.fromStatus ? (
                  <>
                    <span className="text-slate-500 dark:text-slate-400">{WORK_ORDER_STATUS_LABELS[ev.fromStatus as StatusKey] ?? ev.fromStatus}</span>
                    {' → '}
                  </>
                ) : null}
                <span>{WORK_ORDER_STATUS_LABELS[ev.toStatus as StatusKey] ?? ev.toStatus}</span>
              </p>
              {ev.changedBy && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Por: {ev.changedBy}</p>
              )}
              {ev.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 italic">&ldquo;{ev.notes}&rdquo;</p>
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
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrderDetailPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [statusForm, setStatusForm] = useState({ status: '' as StatusKey | '', notes: '' });
  const [editForm, setEditForm] = useState({
    technicianId: '',
    priority: '' as PriorityKey | '',
    mileage: '' as string,
    internalNotes: '',
  });

  const [savingStatus, setSavingStatus] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

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
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    if (!token) return;

    const init = async () => {
      setIsLoading(true);
      try {
        const orderRes = await workOrderApi.getById(params.id, token);
        setWorkOrder(orderRes.data);
      } catch {
        showToast({ title: 'Error', message: 'No se pudo cargar la orden', type: 'error' });
      } finally {
        setIsLoading(false);
      }

      const warnings = searchParams.get('warnings');
      if (warnings) {
        showToast({
          title: 'Algunos servicios no se aplicaron',
          message: `No se pudieron agregar: ${decodeURIComponent(warnings)}. Agrégalos manualmente desde esta pantalla.`,
          type: 'warning',
        });
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Catalog data is non-critical — load separately so a catalog failure
      // doesn't prevent the work order from rendering.
      try {
        const [employeesRes, ratesRes, partsRes, servicesRes] = await Promise.all([
          adminApi.getUsers(token, 'EMPLOYEE'),
          catalogApi.getLaborRates(token),
          catalogApi.getSpareParts(token),
          serviceApi.getAll(token),
        ]);
        setEmployees(Array.isArray(employeesRes) ? employeesRes : []);
        setLaborRates(ratesRes.data ?? []);
        setSpareParts(partsRes.data ?? []);
        setServices(servicesRes ?? []);
      } catch {
        // dropdowns will be empty but the page still works
      }
    };

    init();
  }, [user, token, authLoading, router, params.id, showToast, searchParams]);

  // ── Invoice download ──

  const handleDownloadInvoice = async () => {
    if (!workOrder || !token) return;
    try {
      const blob = await workOrderApi.downloadInvoice(workOrder.id, token);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${workOrder.orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Error al descargar la factura',
        type: 'error',
      });
    }
  };

  // ── Status modal ──

  function handleInitiateStatusChange(status: StatusKey) {
    setStatusForm({ status, notes: '' });
    setShowStatusModal(true);
  }

  async function handleChangeStatus() {
    if (!workOrder || !statusForm.status) return;
    setSavingStatus(true);
    try {
      await workOrderApi.changeStatus(workOrder.id, statusForm.status, statusForm.notes, token!);
      showToast({ title: 'Estado actualizado', message: `La orden pasó a ${WORK_ORDER_STATUS_LABELS[statusForm.status as StatusKey]}`, type: 'success' });
      await loadWorkOrder();
      setShowStatusModal(false);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo cambiar el estado', type: 'error' });
    } finally {
      setSavingStatus(false);
    }
  }

  // ── Edit modal ──

  function openEditModal() {
    if (!workOrder) return;
    setEditForm({
      technicianId: workOrder.technicianId ?? '',
      priority: workOrder.priority,
      mileage: workOrder.mileage != null ? String(workOrder.mileage) : '',
      internalNotes: workOrder.internalNotes ?? '',
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!workOrder) return;
    setSavingEdit(true);
    try {
      const payload: Partial<WorkOrder> = {
        priority: editForm.priority as PriorityKey,
        internalNotes: editForm.internalNotes,
        ...(editForm.technicianId && { technicianId: editForm.technicianId }),
        ...(editForm.mileage !== '' && { mileage: parseInt(editForm.mileage, 10) }),
      };
      await workOrderApi.update(workOrder.id, payload, token!);
      showToast({ title: 'Guardado', message: 'Orden actualizada', type: 'success' });
      await loadWorkOrder();
      setShowEditModal(false);
    } catch {
      showToast({ title: 'Error', message: 'No se pudo actualizar la orden', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Render ──

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

  const nextOptions   = NEXT_STATUSES[workOrder.status] ?? [];
  const forwardOptions = nextOptions.filter((s) => s !== 'CANCELLED');
  const canCancel      = nextOptions.includes('CANCELLED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/admin/ordenes-trabajo')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a órdenes
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {workOrder.orderNumber}
                </h1>
                <Badge variant={WORK_ORDER_STATUS_VARIANTS[workOrder.status]}>{WORK_ORDER_STATUS_LABELS[workOrder.status]}</Badge>
                <Badge variant={PRIORITY_VARIANTS[workOrder.priority]} size="sm">{PRIORITY_LABELS[workOrder.priority]}</Badge>
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

            {/* Action bar */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap items-start">
              {forwardOptions.map((s, i) => (
                <Button
                  key={s}
                  variant={i === 0 ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleInitiateStatusChange(s)}
                >
                  {ADVANCE_LABELS[s] ?? WORK_ORDER_STATUS_LABELS[s]}
                </Button>
              ))}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/20"
                  onClick={() => handleInitiateStatusChange('CANCELLED')}
                >
                  Cancelar orden
                </Button>
              )}
              {(workOrder.status === 'COMPLETED' ||
                workOrder.status === 'INVOICED'  ||
                workOrder.status === 'DELIVERED') && (
                <Button variant="secondary" size="sm" onClick={handleDownloadInvoice}>
                  <FileText className="w-4 h-4" />
                  {workOrder.status === 'COMPLETED' ? 'Generar Factura' : 'Descargar Factura'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={openEditModal}>
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </div>

          <StatusStepper currentStatus={workOrder.status} />
        </div>
      </div>

      {/* Sections */}
      <ServicesSection
        workOrder={workOrder}
        token={token!}
        services={services}
        onRefresh={loadWorkOrder}
        showToast={showToast}
      />

      <DiagnosisSection
        workOrder={workOrder}
        token={token!}
        onRefresh={loadWorkOrder}
        showToast={showToast}
      />

      <LaborSection
        workOrder={workOrder}
        token={token!}
        employees={employees}
        laborRates={laborRates}
        onRefresh={loadWorkOrder}
        showToast={showToast}
      />

      <PartsSection
        workOrder={workOrder}
        token={token!}
        spareParts={spareParts}
        onRefresh={loadWorkOrder}
        showToast={showToast}
      />

      <CostSummarySection
        workOrder={workOrder}
        token={token!}
        onRefresh={loadWorkOrder}
        showToast={showToast}
      />

      <PhotosSection
        workOrder={workOrder}
        token={token!}
        onRefresh={loadWorkOrder}
        showToast={showToast}
      />

      <StatusHistorySection workOrder={workOrder} />

      {/* StatusModal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)}>
        <div className="p-6 space-y-4">
          {statusForm.status === 'CANCELLED' ? (
            <>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Cancelar orden</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Esta acción es irreversible. La orden quedará en estado cancelado.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {ADVANCE_LABELS[statusForm.status as StatusKey] ?? WORK_ORDER_STATUS_LABELS[statusForm.status as StatusKey]}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                La orden pasará de{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">{WORK_ORDER_STATUS_LABELS[workOrder.status]}</span>
                {' '}a{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">{WORK_ORDER_STATUS_LABELS[statusForm.status as StatusKey]}</span>.
              </p>
            </>
          )}

          <div>
            <label className={LABEL_CLASS}>Notas (opcional)</label>
            <textarea
              rows={3}
              value={statusForm.notes}
              onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
              className={INPUT_CLASS}
              placeholder="Ej: diagnóstico completado, esperando repuestos..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              {statusForm.status === 'CANCELLED' ? 'Volver' : 'Cancelar'}
            </Button>
            <Button
              onClick={handleChangeStatus}
              isLoading={savingStatus}
              {...(statusForm.status === 'CANCELLED' && {
                className: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
              })}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* EditModal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editar orden</h3>

          <div>
            <label className={LABEL_CLASS}>Técnico asignado</label>
            <select
              value={editForm.technicianId}
              onChange={(e) => setEditForm({ ...editForm, technicianId: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="">Sin asignar</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Prioridad</label>
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as PriorityKey })}
              className={INPUT_CLASS}
            >
              {(Object.keys(PRIORITY_LABELS) as PriorityKey[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Kilometraje</label>
            <input
              type="number"
              min={0}
              value={editForm.mileage}
              onChange={(e) => setEditForm({ ...editForm, mileage: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Notas internas</label>
            <textarea
              rows={3}
              value={editForm.internalNotes}
              onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleEdit} isLoading={savingEdit}>Guardar</Button>
          </div>
        </div>
      </Modal>

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
