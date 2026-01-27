'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { vehicleApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleFormModalProps {
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    year: number | null;
    color: string | null;
    vehicleType: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

const vehicleTypes = [
  { value: 'SEDAN', label: 'Sedán' },
  { value: 'SUV', label: 'SUV' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'VAN', label: 'Van' },
  { value: 'MOTORCYCLE', label: 'Motocicleta' },
];

export default function VehicleFormModal({ vehicle, onClose, onSuccess }: VehicleFormModalProps) {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      plate: formData.get('plate') as string,
      year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
      color: formData.get('color') as string,
      vehicleType: formData.get('vehicleType') as string,
      ownerName: user?.name || '',
      ownerPhone: user?.phone || null,
    };

    try {
      if (!token) throw new Error('No token');
      if (!user?.name) throw new Error('No se pudo obtener el nombre del usuario');

      if (vehicle) {
        await vehicleApi.update(vehicle.id, data, token);
      } else {
        await vehicleApi.create(data, token);
      }

      router.refresh();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {vehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Marca *
              </label>
              <input
                type="text"
                name="brand"
                defaultValue={vehicle?.brand}
                required
                placeholder="Toyota, Honda, Ford..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                name="model"
                defaultValue={vehicle?.model}
                required
                placeholder="Corolla, Civic, Focus..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Placas *
              </label>
              <input
                type="text"
                name="plate"
                defaultValue={vehicle?.plate}
                required
                placeholder="ABC-123-D"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Año
              </label>
              <input
                type="number"
                name="year"
                defaultValue={vehicle?.year || ''}
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="2024"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                defaultValue={vehicle?.color || ''}
                placeholder="Blanco, Negro, Rojo..."
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Vehículo *
              </label>
              <select
                name="vehicleType"
                defaultValue={vehicle?.vehicleType}
                required
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="">Selecciona un tipo</option>
                {vehicleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                vehicle ? 'Actualizar Vehículo' : 'Agregar Vehículo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
