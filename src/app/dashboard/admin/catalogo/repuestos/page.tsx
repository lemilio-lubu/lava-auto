'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Edit, Trash, X, AlertTriangle } from 'lucide-react';
import { catalogApi, SparePart, SparePartCategory } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';

type FormData = {
  name: string; partNumber: string; categoryId: string;
  unit: string; unitPrice: string; stockQuantity: string; minStock: string; isActive: boolean;
};

const defaultForm = (): FormData => ({
  name: '', partNumber: '', categoryId: '', unit: 'unidad',
  unitPrice: '', stockQuantity: '0', minStock: '0', isActive: true,
});

const INPUT_CLS = 'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
const LABEL_CLS = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

function SparePartForm({
  formData, setFormData, categories, editing, isSaving, onClose,
}: {
  formData: FormData;
  setFormData: (d: FormData) => void;
  categories: SparePartCategory[];
  editing: SparePart | null;
  isSaving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL_CLS}>Nombre *</label>
          <input type="text" required value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={INPUT_CLS} placeholder="Ej: Filtro de aceite" />
        </div>
        <div>
          <label className={LABEL_CLS}>N° de Parte</label>
          <input type="text" value={formData.partNumber}
            onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
            className={INPUT_CLS} placeholder="Ej: FO-001" />
        </div>
        <div>
          <label className={LABEL_CLS}>Categoría</label>
          <select value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className={INPUT_CLS}>
            <option value="">Sin categoría</option>
            {categories.filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Unidad *</label>
          <input type="text" required value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className={INPUT_CLS} placeholder="unidad" />
        </div>
        <div>
          <label className={LABEL_CLS}>Precio unitario ($) *</label>
          <input type="number" required min="0" step="0.01" value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            className={INPUT_CLS} placeholder="0.00" />
        </div>
        <div>
          <label className={LABEL_CLS}>Stock actual</label>
          <input type="number" min="0" value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
            className={INPUT_CLS} />
        </div>
        <div>
          <label className={LABEL_CLS}>Stock mínimo</label>
          <input type="number" min="0" value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            className={INPUT_CLS} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500" />
        <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">Activo</label>
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={isSaving}>Cancelar</Button>
        <Button type="submit" fullWidth disabled={isSaving}>
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : (editing ? 'Actualizar' : 'Crear')}
        </Button>
      </div>
    </div>
  );
}

export default function RepuestosAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<SparePart[]>([]);
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm());
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    loadData();
  }, [user, token, authLoading, router]);

  const loadData = async () => {
    if (!token) return;
    try {
      const [partsRes, catsRes] = await Promise.all([
        catalogApi.getSpareParts(token),
        catalogApi.getSparePartCategories(token),
      ]);
      setItems(partsRes.data);
      setCategories(catsRes.data);
    } catch {
      // silently fail on load
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (id?: string) =>
    id ? (categories.find((c) => c.id === id)?.name ?? '—') : '—';

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData(defaultForm());
    setShowModal(true);
  };

  const handleOpenEdit = (item: SparePart) => {
    setEditing(item);
    setFormData({
      name: item.name, partNumber: item.partNumber ?? '', categoryId: item.categoryId ?? '',
      unit: item.unit, unitPrice: item.unitPrice.toString(),
      stockQuantity: item.stockQuantity.toString(), minStock: item.minStock.toString(),
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const payload: Omit<SparePart, 'id'> = {
        name: formData.name,
        partNumber: formData.partNumber || undefined,
        categoryId: formData.categoryId || undefined,
        unit: formData.unit,
        unitPrice: parseFloat(formData.unitPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        minStock: parseInt(formData.minStock),
        isActive: formData.isActive,
      };
      if (editing) {
        await catalogApi.updateSparePart(editing.id, payload, token);
        setToast({ isOpen: true, title: 'Éxito', message: 'Repuesto actualizado', type: 'success' });
      } else {
        await catalogApi.createSparePart(payload, token);
        setToast({ isOpen: true, title: 'Éxito', message: 'Repuesto creado', type: 'success' });
      }
      setShowModal(false);
      loadData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      setToast({ isOpen: true, title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`¿Eliminar el repuesto "${name}"?`)) return;
    try {
      await catalogApi.deleteSparePart(id, token);
      setToast({ isOpen: true, title: 'Éxito', message: 'Repuesto eliminado', type: 'success' });
      loadData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      setToast({ isOpen: true, title: 'Error', message: msg, type: 'error' });
    }
  };

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Repuestos e Insumos</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona el inventario de piezas y materiales</p>
        </div>
        <Button onClick={handleOpenCreate}><Plus className="w-5 h-5" /> Nuevo Repuesto</Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Nombre</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">N° Parte</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Categoría</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Precio</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Stock</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Estado</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {items.map((item) => {
              const isLowStock = item.stockQuantity <= item.minStock;
              return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.partNumber ?? '—'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{getCategoryName(item.categoryId)}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">${item.unitPrice}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.stockQuantity}
                      </span>
                      {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(item)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id, item.name)}><Trash className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            No hay repuestos registrados.{' '}
            <button onClick={handleOpenCreate} className="text-cyan-600 hover:underline font-medium">Crear el primero</button>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editing ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h2>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <SparePartForm
              formData={formData} setFormData={setFormData}
              categories={categories} editing={editing}
              isSaving={isSaving} onClose={() => setShowModal(false)}
            />
          </form>
        </div>
      </Modal>

      <Toast isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} title={toast.title} message={toast.message} type={toast.type} />
    </div>
  );
}
