'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Edit, Trash, X, Wrench, Package } from 'lucide-react';
import {
  serviceApi,
  catalogApi,
  type Service,
  type ServiceWriteData,
  type LaborRate,
  type SparePart,
} from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';

const VEHICLE_TYPES = ['SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'VAN', 'MOTORCYCLE'];

const INPUT_CLASS =
  'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type DraftLaborItem = { tempId: string; laborRateId: string; hours: number };
type DraftPartItem = { tempId: string; sparePartId: string; quantity: number };

type ServiceFormData = {
  name: string;
  description: string;
  duration: string;
  price: string;
  vehicleType: string;
  isActive: boolean;
};

const emptyForm = (): ServiceFormData => ({
  name: '',
  description: '',
  duration: '',
  price: '',
  vehicleType: 'SEDAN',
  isActive: true,
});

function fmt(n: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);
}

function newTempId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

// ─── LaborComposer ──────────────────────────────────────────────────────────

function LaborComposer({
  laborRates,
  items,
  setItems,
}: {
  laborRates: LaborRate[];
  items: DraftLaborItem[];
  setItems: (items: DraftLaborItem[]) => void;
}) {
  const [rateId, setRateId] = useState('');
  const [hours, setHours] = useState(1);

  function add() {
    if (!rateId) return;
    setItems([...items, { tempId: newTempId(), laborRateId: rateId, hours }]);
    setRateId('');
    setHours(1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <Wrench className="w-4 h-4" /> Mano de obra
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 pr-3">Tarifa</th>
                <th className="text-right py-2 px-3">Horas</th>
                <th className="text-right py-2 px-3">Tarifa/h</th>
                <th className="text-right py-2 px-3">Subtotal</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((it) => {
                const rate = laborRates.find((r) => r.id === it.laborRateId);
                const rph = rate?.ratePerHour ?? 0;
                return (
                  <tr key={it.tempId}>
                    <td className="py-2 pr-3 text-slate-900 dark:text-white">{rate?.name ?? '—'}</td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{it.hours}</td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{fmt(rph)}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">{fmt(it.hours * rph)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((x) => x.tempId !== it.tempId))}
                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Quitar tarea"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div className="sm:col-span-7">
          <label className="text-xs text-slate-500 dark:text-slate-400">Tarifa de mano de obra</label>
          <select value={rateId} onChange={(e) => setRateId(e.target.value)} className={INPUT_CLASS}>
            <option value="">Seleccionar tarifa...</option>
            {laborRates.filter((r) => r.isActive).map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {fmt(r.ratePerHour)}/h</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs text-slate-500 dark:text-slate-400">Horas</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="button" variant="secondary" fullWidth onClick={add} disabled={!rateId}>
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── PartsComposer ──────────────────────────────────────────────────────────

function PartsComposer({
  spareParts,
  items,
  setItems,
}: {
  spareParts: SparePart[];
  items: DraftPartItem[];
  setItems: (items: DraftPartItem[]) => void;
}) {
  const [partId, setPartId] = useState('');
  const [quantity, setQuantity] = useState(1);

  function add() {
    if (!partId) return;
    setItems([...items, { tempId: newTempId(), sparePartId: partId, quantity }]);
    setPartId('');
    setQuantity(1);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <Package className="w-4 h-4" /> Repuestos
      </div>

      {items.length > 0 && (
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
              {items.map((it) => {
                const part = spareParts.find((p) => p.id === it.sparePartId);
                const up = part?.unitPrice ?? 0;
                return (
                  <tr key={it.tempId}>
                    <td className="py-2 pr-3 text-slate-900 dark:text-white">{part?.name ?? '—'}</td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{it.quantity}</td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">{fmt(up)}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">{fmt(it.quantity * up)}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setItems(items.filter((x) => x.tempId !== it.tempId))}
                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Quitar repuesto"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
        <div className="sm:col-span-7">
          <label className="text-xs text-slate-500 dark:text-slate-400">Repuesto del catálogo</label>
          <select value={partId} onChange={(e) => setPartId(e.target.value)} className={INPUT_CLASS}>
            <option value="">Seleccionar repuesto...</option>
            {spareParts.filter((p) => p.isActive).map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {fmt(p.unitPrice)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs text-slate-500 dark:text-slate-400">Cantidad</label>
          <input
            type="number"
            min={0}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="button" variant="secondary" fullWidth onClick={add} disabled={!partId}>
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ServiciosAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [hadComposition, setHadComposition] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm());
  const [laborItems, setLaborItems] = useState<DraftLaborItem[]>([]);
  const [partItems, setPartItems] = useState<DraftPartItem[]>([]);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as ToastType,
  });

  const showToast = (title: string, message: string, type: ToastType) =>
    setToast({ isOpen: true, title, message, type });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadAll();
  }, [user, token, authLoading, router]);

  const loadAll = async () => {
    if (!token) return;
    try {
      const data = await serviceApi.getAll(token);
      setServices(data);
    } catch {
      // silently fail on load
    } finally {
      setIsLoading(false);
    }
    // Catálogos para los composers — no críticos para listar.
    try {
      const [ratesRes, partsRes] = await Promise.all([
        catalogApi.getLaborRates(token),
        catalogApi.getSpareParts(token),
      ]);
      setLaborRates(ratesRes.data ?? []);
      setSpareParts(partsRes.data ?? []);
    } catch {
      // composers quedarán vacíos
    }
  };

  const resetComposition = () => {
    setLaborItems([]);
    setPartItems([]);
    setHadComposition(false);
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData(emptyForm());
    resetComposition();
    setShowModal(true);
  };

  const handleOpenEdit = async (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
      vehicleType: service.vehicleType,
      isActive: service.isActive,
    });
    resetComposition();
    setShowModal(true);
    // Cargar composición completa del servicio.
    if (!token) return;
    try {
      const full = await serviceApi.getById(service.id, token);
      const labor = (full.laborItems ?? []).map((li) => ({
        tempId: newTempId(),
        laborRateId: li.laborRateId,
        hours: li.hours,
      }));
      const parts = (full.partItems ?? []).map((pi) => ({
        tempId: newTempId(),
        sparePartId: pi.sparePartId,
        quantity: pi.quantity,
      }));
      setLaborItems(labor);
      setPartItems(parts);
      setHadComposition(labor.length > 0 || parts.length > 0);
    } catch {
      // si falla, se edita sin composición previa cargada
    }
  };

  const laborTotal = laborItems.reduce(
    (s, it) => s + it.hours * (laborRates.find((r) => r.id === it.laborRateId)?.ratePerHour ?? 0),
    0
  );
  const partsTotal = partItems.reduce(
    (s, it) => s + it.quantity * (spareParts.find((p) => p.id === it.sparePartId)?.unitPrice ?? 0),
    0
  );
  const hasComposition = laborItems.length > 0 || partItems.length > 0;
  const computedPrice = laborTotal + partsTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    try {
      const data: ServiceWriteData = {
        name: formData.name,
        description: formData.description || undefined,
        duration: parseInt(formData.duration),
        vehicleType: formData.vehicleType,
        isActive: formData.isActive,
      };

      // Enviar composición cuando hay items, o cuando se vaciaron items previos
      // (para limpiarlos en el backend). Si nunca hubo composición, se respeta
      // el precio manual.
      if (hasComposition || hadComposition) {
        data.laborItems = laborItems.map((it) => ({ laborRateId: it.laborRateId, hours: it.hours }));
        data.partItems = partItems.map((it) => ({ sparePartId: it.sparePartId, quantity: it.quantity }));
      } else {
        data.price = parseFloat(formData.price);
      }

      if (editingService) {
        await serviceApi.update(editingService.id, data, token);
        showToast('Éxito', 'Servicio actualizado correctamente', 'success');
      } else {
        await serviceApi.create(data, token);
        showToast('Éxito', 'Servicio creado correctamente', 'success');
      }

      setShowModal(false);
      loadAll();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar el servicio';
      showToast('Error', message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`¿Estás seguro de eliminar el servicio "${name}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      await serviceApi.delete(id, token);
      showToast('Éxito', 'Servicio eliminado correctamente', 'success');
      loadAll();
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      const isConflict = status === 409;
      const message = error instanceof Error ? error.message : 'Error al eliminar el servicio';
      showToast(
        isConflict ? 'No se puede eliminar' : 'Error',
        isConflict
          ? `El servicio "${name}" tiene reservas asociadas. Desactívalo en lugar de eliminarlo.`
          : message,
        'error'
      );
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Servicios</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Cada servicio agrupa su mano de obra y repuestos; su precio se calcula automáticamente.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                    {service.vehicleType}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    service.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                  {service.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {service.description || 'Sin descripción'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 mb-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Precio</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(service.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Duración</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {service.duration} min
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleOpenEdit(service)}
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(service.id, service.name)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No hay servicios registrados
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-5 h-5" />
            Crear Primer Servicio
          </Button>
        </div>
      )}

      {/* Modal de Crear/Editar */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={LABEL_CLASS}>Nombre del Servicio *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={INPUT_CLASS}
                placeholder="Ej: Cambio de aceite + filtros"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={INPUT_CLASS}
                rows={2}
                placeholder="Descripción del servicio"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Duración (minutos) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="60"
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Tipo de Vehículo *</label>
                <select
                  required
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className={INPUT_CLASS}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Composición */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-5">
              <LaborComposer laborRates={laborRates} items={laborItems} setItems={setLaborItems} />
              <PartsComposer spareParts={spareParts} items={partItems} setItems={setPartItems} />
            </div>

            {/* Precio */}
            <div>
              <label className={LABEL_CLASS}>Precio ($) {hasComposition ? '(automático)' : '*'}</label>
              {hasComposition ? (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 space-y-1">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Mano de obra</span><span>{fmt(laborTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Repuestos</span><span>{fmt(partsTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400 border-t border-emerald-200 dark:border-emerald-800 pt-1">
                    <span>Total</span><span>{fmt(computedPrice)}</span>
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="100.00"
                />
              )}
              {hasComposition && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  El precio se calcula desde la mano de obra y los repuestos del servicio.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Servicio activo
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowModal(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth isLoading={isSaving} disabled={!formData.name || !formData.duration}>
                {editingService ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
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
