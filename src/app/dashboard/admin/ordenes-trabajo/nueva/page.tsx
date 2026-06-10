'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  workOrderApi,
  adminApi,
  catalogApi,
  type User,
  type Vehicle,
  type LaborRate,
  type SparePart,
} from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

type DraftLabor = {
  tempId: string;
  laborRateId: string;
  description: string;
  hours: number;
  ratePerHour: number;
};

type DraftPart = {
  tempId: string;
  sparePartId: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Baja' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

const INPUT_CLASS =
  'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

function fmt(n: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);
}

function newTempId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

// ─── LaborEditor ────────────────────────────────────────────────────────────

function LaborEditor({
  laborRates,
  lines,
  setLines,
}: {
  laborRates: LaborRate[];
  lines: DraftLabor[];
  setLines: (lines: DraftLabor[]) => void;
}) {
  const [draft, setDraft] = useState<DraftLabor>({
    tempId: '',
    laborRateId: '',
    description: '',
    hours: 1,
    ratePerHour: 0,
  });

  function pickRate(id: string) {
    const r = laborRates.find((x) => x.id === id);
    setDraft((d) => ({
      ...d,
      laborRateId: id,
      ratePerHour: r ? r.ratePerHour : d.ratePerHour,
      description: r && !d.description ? r.name : d.description,
    }));
  }

  function add() {
    if (!draft.description) return;
    setLines([...lines, { ...draft, tempId: newTempId() }]);
    setDraft({ tempId: '', laborRateId: '', description: '', hours: 1, ratePerHour: 0 });
  }

  return (
    <div className="space-y-3">
      {lines.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 pr-3">Actividad</th>
                <th className="text-right py-2 px-3">Horas</th>
                <th className="text-right py-2 px-3">Tarifa/h</th>
                <th className="text-right py-2 px-3">Subtotal</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {lines.map((l) => (
                <tr key={l.tempId}>
                  <td className="py-2 pr-3 text-slate-900 dark:text-white">{l.description}</td>
                  <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{l.hours}</td>
                  <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{fmt(l.ratePerHour)}</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">
                    {fmt(l.hours * l.ratePerHour)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setLines(lines.filter((x) => x.tempId !== l.tempId))}
                      className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div className="sm:col-span-5">
          <label className="text-xs text-slate-500 dark:text-slate-400">Del catálogo</label>
          <select value={draft.laborRateId} onChange={(e) => pickRate(e.target.value)} className={INPUT_CLASS}>
            <option value="">Tarifa de mano de obra...</option>
            {laborRates.filter((r) => r.isActive).map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {fmt(r.ratePerHour)}/h</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs text-slate-500 dark:text-slate-400">Descripción</label>
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Horas</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={draft.hours}
            onChange={(e) => setDraft({ ...draft, hours: parseFloat(e.target.value) || 0 })}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="button" variant="secondary" fullWidth onClick={add} disabled={!draft.description}>
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── PartsEditor ────────────────────────────────────────────────────────────

function PartsEditor({
  spareParts,
  lines,
  setLines,
}: {
  spareParts: SparePart[];
  lines: DraftPart[];
  setLines: (lines: DraftPart[]) => void;
}) {
  const [draft, setDraft] = useState<DraftPart>({
    tempId: '',
    sparePartId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  function pickPart(id: string) {
    const p = spareParts.find((x) => x.id === id);
    setDraft((d) => ({
      ...d,
      sparePartId: id,
      unitPrice: p ? p.unitPrice : d.unitPrice,
      description: p && !d.description ? p.name : d.description,
    }));
  }

  function add() {
    if (!draft.description) return;
    setLines([...lines, { ...draft, tempId: newTempId() }]);
    setDraft({ tempId: '', sparePartId: '', description: '', quantity: 1, unitPrice: 0 });
  }

  return (
    <div className="space-y-3">
      {lines.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 pr-3">Repuesto</th>
                <th className="text-right py-2 px-3">Cant.</th>
                <th className="text-right py-2 px-3">Precio U.</th>
                <th className="text-right py-2 px-3">Subtotal</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {lines.map((p) => (
                <tr key={p.tempId}>
                  <td className="py-2 pr-3 text-slate-900 dark:text-white">{p.description}</td>
                  <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{p.quantity}</td>
                  <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{fmt(p.unitPrice)}</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">
                    {fmt(p.quantity * p.unitPrice)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setLines(lines.filter((x) => x.tempId !== p.tempId))}
                      className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div className="sm:col-span-5">
          <label className="text-xs text-slate-500 dark:text-slate-400">Del catálogo</label>
          <select value={draft.sparePartId} onChange={(e) => pickPart(e.target.value)} className={INPUT_CLASS}>
            <option value="">Repuesto...</option>
            {spareParts.filter((p) => p.isActive).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {fmt(p.unitPrice)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs text-slate-500 dark:text-slate-400">Descripción</label>
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Cantidad</label>
          <input
            type="number"
            min={0}
            step={1}
            value={draft.quantity}
            onChange={(e) => setDraft({ ...draft, quantity: parseFloat(e.target.value) || 0 })}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="button" variant="secondary" fullWidth onClick={add} disabled={!draft.description}>
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NuevaOrdenPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [clients, setClients] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);

  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [mileage, setMileage] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  const [laborLines, setLaborLines] = useState<DraftLabor[]>([]);
  const [partLines, setPartLines] = useState<DraftPart[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadSelectData();
  }, [user, token, authLoading, router]);

  const loadSelectData = async () => {
    if (!token) return;
    try {
      const [clientsRes, techRes] = await Promise.all([
        adminApi.getUsers(token, 'CLIENT'),
        adminApi.getUsers(token, 'EMPLOYEE'),
      ]);
      setClients(clientsRes);
      setTechnicians(techRes);
    } catch {
      setToast({ isOpen: true, title: 'Error', message: 'No se pudieron cargar los datos', type: 'error' });
    }

    // Catalog is non-critical for header creation — load separately.
    try {
      const [ratesRes, partsRes] = await Promise.all([
        catalogApi.getLaborRates(token),
        catalogApi.getSpareParts(token),
      ]);
      setLaborRates(ratesRes.data ?? []);
      setSpareParts(partsRes.data ?? []);
    } catch {
      // editors will show empty catalogs but custom entry still works
    }
  };

  const loadVehiclesForClient = async (selectedClientId: string) => {
    if (!token || !selectedClientId) {
      setVehicles([]);
      setVehicleId('');
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/vehicles/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const allVehicles: Vehicle[] = json.data ?? json ?? [];
      const clientVehicles = allVehicles.filter((v) => v.userId === selectedClientId);
      setVehicles(clientVehicles);
      setVehicleId('');
    } catch {
      setVehicles([]);
    }
  };

  const handleClientChange = (id: string) => {
    setClientId(id);
    loadVehiclesForClient(id);
  };

  const laborTotal = laborLines.reduce((s, l) => s + l.hours * l.ratePerHour, 0);
  const partsTotal = partLines.reduce((s, p) => s + p.quantity * p.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clientId || !vehicleId) return;

    setIsSaving(true);
    try {
      const res = await workOrderApi.create(
        {
          clientId,
          vehicleId,
          technicianId: technicianId || undefined,
          priority,
          mileage: mileage ? parseInt(mileage) : undefined,
          problemDescription: problemDescription || undefined,
        },
        token
      );
      const orderId = res.data.id;

      // Persist body lines using the existing per-line endpoints. Each call
      // recalculates the order totals on the backend.
      let linesFailed = false;
      try {
        for (const l of laborLines) {
          await workOrderApi.addLaborLine(
            orderId,
            {
              description: l.description,
              hours: l.hours,
              ratePerHour: l.ratePerHour,
              ...(l.laborRateId && { laborRateId: l.laborRateId }),
              ...(technicianId && { technicianId }),
            },
            token
          );
        }
        for (const p of partLines) {
          await workOrderApi.addPartLine(
            orderId,
            {
              description: p.description,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              ...(p.sparePartId && { sparePartId: p.sparePartId }),
            },
            token
          );
        }
      } catch {
        linesFailed = true;
      }

      if (linesFailed) {
        setToast({
          isOpen: true,
          title: 'Orden creada con avisos',
          message: 'La orden se creó pero algunas líneas no se guardaron. Revisalas en el detalle.',
          type: 'warning',
        });
      }

      router.push(`/dashboard/admin/ordenes-trabajo/${orderId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la orden';
      setToast({ isOpen: true, title: 'Error', message, type: 'error' });
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/admin/ordenes-trabajo"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Órdenes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Orden de Trabajo</h1>
        <p className="text-slate-600 dark:text-slate-400">Completa los datos para abrir una nueva orden</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Encabezado */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
          <div>
            <label className={LABEL_CLASS}>Cliente *</label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Vehículo *</label>
            <select
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={!clientId}
              className={INPUT_CLASS}
            >
              <option value="">
                {clientId ? 'Seleccionar vehículo...' : 'Primero seleccioná un cliente'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                </option>
              ))}
            </select>
            {clientId && vehicles.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Este cliente no tiene vehículos registrados</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Técnico asignado</label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Sin asignar</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={INPUT_CLASS}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Kilometraje</label>
              <input
                type="number"
                min="0"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="Ej: 45000"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Descripción del problema</label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Describa el problema reportado por el cliente..."
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Mano de obra */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Mano de Obra</h2>
          <LaborEditor laborRates={laborRates} lines={laborLines} setLines={setLaborLines} />
        </div>

        {/* Repuestos */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Repuestos y Materiales</h2>
          <PartsEditor spareParts={spareParts} lines={partLines} setLines={setPartLines} />
        </div>

        {/* Resumen + acciones */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Mano de obra</span>
              <span>{fmt(laborTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>Repuestos</span>
              <span>{fmt(partsTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Subtotal</span>
              <span>{fmt(laborTotal + partsTotal)}</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Descuentos e impuestos se ajustan en el detalle.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => router.push('/dashboard/admin/ordenes-trabajo')}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" fullWidth isLoading={isSaving} disabled={!clientId || !vehicleId}>
              Crear Orden
            </Button>
          </div>
        </div>
      </form>

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
