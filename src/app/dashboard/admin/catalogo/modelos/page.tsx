'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Edit, Trash, X } from 'lucide-react';
import { catalogApi, Model, Brand } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';

type FormData = { brandId: string; name: string; yearFrom: string; yearTo: string; isActive: boolean };

const defaultForm = (): FormData => ({ brandId: '', name: '', yearFrom: '', yearTo: '', isActive: true });

const INPUT_CLS = 'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
const LABEL_CLS = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

export default function ModelosAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
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
      const [modelsRes, brandsRes] = await Promise.all([
        catalogApi.getModels(token),
        catalogApi.getBrands(token),
      ]);
      setItems(modelsRes.data);
      setBrands(brandsRes.data);
    } catch {
      // silently fail on load
    } finally {
      setIsLoading(false);
    }
  };

  const getBrandName = (brandId: string) =>
    brands.find((b) => b.id === brandId)?.name ?? '—';

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData({ ...defaultForm(), brandId: brands[0]?.id ?? '' });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Model) => {
    setEditing(item);
    setFormData({
      brandId: item.brandId,
      name: item.name,
      yearFrom: item.yearFrom?.toString() ?? '',
      yearTo: item.yearTo?.toString() ?? '',
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const payload: Omit<Model, 'id'> = {
        brandId: formData.brandId,
        name: formData.name,
        yearFrom: formData.yearFrom ? parseInt(formData.yearFrom) : undefined,
        yearTo: formData.yearTo ? parseInt(formData.yearTo) : undefined,
        isActive: formData.isActive,
      };
      if (editing) {
        await catalogApi.updateModel(editing.id, payload, token);
        setToast({ isOpen: true, title: 'Éxito', message: 'Modelo actualizado', type: 'success' });
      } else {
        await catalogApi.createModel(payload, token);
        setToast({ isOpen: true, title: 'Éxito', message: 'Modelo creado', type: 'success' });
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
    if (!confirm(`¿Eliminar el modelo "${name}"?`)) return;
    try {
      await catalogApi.deleteModel(id, token);
      setToast({ isOpen: true, title: 'Éxito', message: 'Modelo eliminado', type: 'success' });
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Modelos de Vehículos</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona los modelos por marca</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={brands.length === 0}>
          <Plus className="w-5 h-5" /> Nuevo Modelo
        </Button>
      </div>

      {brands.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-700 dark:text-amber-400 text-sm">
          Primero debes crear al menos una marca antes de agregar modelos.
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Marca</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Modelo</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Año Desde</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Año Hasta</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Estado</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{getBrandName(item.brandId)}</td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.yearFrom ?? '—'}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.yearTo ?? '—'}</td>
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
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            No hay modelos registrados.{' '}
            {brands.length > 0 && <button onClick={handleOpenCreate} className="text-cyan-600 hover:underline font-medium">Crear el primero</button>}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editing ? 'Editar Modelo' : 'Nuevo Modelo'}</h2>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL_CLS}>Marca *</label>
              <select
                required value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className={INPUT_CLS}
              >
                <option value="">Seleccionar marca</option>
                {brands.filter((b) => b.isActive).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Nombre del modelo *</label>
              <input
                type="text" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={INPUT_CLS}
                placeholder="Ej: Corolla"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Año Desde</label>
                <input
                  type="number" min="1900" max="2100"
                  value={formData.yearFrom}
                  onChange={(e) => setFormData({ ...formData, yearFrom: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="2000"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Año Hasta</label>
                <input
                  type="number" min="1900" max="2100"
                  value={formData.yearTo}
                  onChange={(e) => setFormData({ ...formData, yearTo: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="2024"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">Activo</label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" fullWidth disabled={isSaving}>
                {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : (editing ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Toast isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} title={toast.title} message={toast.message} type={toast.type} />
    </div>
  );
}
