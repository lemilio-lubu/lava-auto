'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Edit, Trash, X } from 'lucide-react';
import { catalogApi, LaborRate } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';

type FormData = { name: string; description: string; ratePerHour: string; isActive: boolean };

const defaultForm = (): FormData => ({ name: '', description: '', ratePerHour: '', isActive: true });

export default function TarifasManoObraAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<LaborRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LaborRate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm());
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    loadItems();
  }, [user, token, authLoading, router]);

  const loadItems = async () => {
    if (!token) return;
    try {
      const { data } = await catalogApi.getLaborRates(token);
      setItems(data);
    } catch {
      // silently fail on load
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData(defaultForm());
    setShowModal(true);
  };

  const handleOpenEdit = (item: LaborRate) => {
    setEditing(item);
    setFormData({ name: item.name, description: item.description ?? '', ratePerHour: item.ratePerHour.toString(), isActive: item.isActive });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        ratePerHour: parseFloat(formData.ratePerHour),
        isActive: formData.isActive,
      };
      if (editing) {
        await catalogApi.updateLaborRate(editing.id, payload, token);
        setToast({ isOpen: true, title: 'Éxito', message: 'Tarifa actualizada', type: 'success' });
      } else {
        await catalogApi.createLaborRate(payload, token);
        setToast({ isOpen: true, title: 'Éxito', message: 'Tarifa creada', type: 'success' });
      }
      setShowModal(false);
      loadItems();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      setToast({ isOpen: true, title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`¿Eliminar la tarifa "${name}"?`)) return;
    try {
      await catalogApi.deleteLaborRate(id, token);
      setToast({ isOpen: true, title: 'Éxito', message: 'Tarifa eliminada', type: 'success' });
      loadItems();
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tarifas de Mano de Obra</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona las tarifas por hora del taller</p>
        </div>
        <Button onClick={handleOpenCreate}><Plus className="w-5 h-5" /> Nueva Tarifa</Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Nombre</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Descripción</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Tarifa/hora</th>
              <th className="text-left px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">Estado</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{item.description ?? '—'}</td>
                <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">${item.ratePerHour}/hr</td>
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
            No hay tarifas registradas.{' '}
            <button onClick={handleOpenCreate} className="text-cyan-600 hover:underline font-medium">Crear la primera</button>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editing ? 'Editar Tarifa' : 'Nueva Tarifa'}</h2>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre *</label>
              <input
                type="text" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Ej: Mecánico General"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                rows={2}
                placeholder="Descripción de la tarifa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tarifa por hora ($) *</label>
              <input
                type="number" required min="0" step="0.01"
                value={formData.ratePerHour}
                onChange={(e) => setFormData({ ...formData, ratePerHour: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="25.00"
              />
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
