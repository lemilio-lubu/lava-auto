'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Save, Info } from 'lucide-react';
import { catalogApi, OrderNumberConfig } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

type FormData = { prefix: string; padding: string };

const INPUT_CLS = 'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white';
const LABEL_CLS = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

function buildPreview(prefix: string, padding: number, nextNumber: number): string {
  const padded = String(nextNumber).padStart(padding, '0');
  return `${prefix}${padded}`;
}

export default function NumeracionAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<OrderNumberConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({ prefix: '', padding: '5' });
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    loadConfig();
  }, [user, token, authLoading, router]);

  const loadConfig = async () => {
    if (!token) return;
    try {
      const { data } = await catalogApi.getOrderNumberConfig(token);
      setConfig(data);
      setFormData({ prefix: data.prefix, padding: data.padding.toString() });
    } catch {
      // silently fail on load
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    try {
      const { data } = await catalogApi.updateOrderNumberConfig(
        { prefix: formData.prefix, padding: parseInt(formData.padding) },
        token
      );
      setConfig(data);
      setToast({ isOpen: true, title: 'Éxito', message: 'Configuración guardada', type: 'success' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      setToast({ isOpen: true, title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-cyan-600" /></div>;
  }

  const previewNumber = buildPreview(
    formData.prefix,
    parseInt(formData.padding) || 1,
    config?.nextNumber ?? 1
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Numeración</h1>
        <p className="text-slate-600 dark:text-slate-400">Define el formato de los números de orden de trabajo</p>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div>
            <label className={LABEL_CLS}>Prefijo</label>
            <input
              type="text" value={formData.prefix}
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
              className={INPUT_CLS}
              placeholder="Ej: OT-"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Texto que aparece antes del número (ej: OT-, WO-, #).</p>
          </div>

          <div>
            <label className={LABEL_CLS}>Dígitos (relleno con ceros)</label>
            <input
              type="number" required min="1" max="10"
              value={formData.padding}
              onChange={(e) => setFormData({ ...formData, padding: e.target.value })}
              className={INPUT_CLS}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cantidad de dígitos mínimos del número (se rellena con ceros a la izquierda).</p>
          </div>

          {/* Preview */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider mb-2">Vista previa del próximo número</p>
            <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300 font-mono">{previewNumber}</p>
          </div>

          {/* NextNumber info */}
          {config && (
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>El próximo número secuencial es <strong className="text-slate-700 dark:text-slate-300">{config.nextNumber}</strong>. Este valor es auto-incremental y el sistema lo gestiona automáticamente.</span>
            </div>
          )}

          <Button type="submit" fullWidth disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : <><Save className="w-5 h-5" /> Guardar configuración</>}
          </Button>
        </form>
      </div>

      <Toast isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} title={toast.title} message={toast.message} type={toast.type} />
    </div>
  );
}
