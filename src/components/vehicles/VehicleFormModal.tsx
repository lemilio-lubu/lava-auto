'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { vehicleApi, catalogApi } from '@/lib/api-client';
import type { Brand, Model, FuelType } from '@/lib/api-client';
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
    brandId?: string | null;
    modelId?: string | null;
    fuelTypeId?: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

const vehicleTypes = [
  { value: 'SEDAN',      label: 'Sedán' },
  { value: 'SUV',        label: 'SUV' },
  { value: 'HATCHBACK',  label: 'Hatchback' },
  { value: 'PICKUP',     label: 'Pickup' },
  { value: 'VAN',        label: 'Van' },
  { value: 'MOTORCYCLE', label: 'Motocicleta' },
];

const selectClass =
  'w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg ' +
  'focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const inputClass =
  'w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg ' +
  'focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white';

export default function VehicleFormModal({ vehicle, onClose, onSuccess }: VehicleFormModalProps) {
  const router = useRouter();
  const { token, user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  // Catalog state
  const [brands,    setBrands]    = useState<Brand[]>([]);
  const [models,    setModels]    = useState<Model[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogEmpty,   setCatalogEmpty]   = useState(false);

  // Selected FK values (controlled)
  const [selectedBrandId,    setSelectedBrandId]    = useState<string>(vehicle?.brandId ?? '');
  const [selectedModelId,    setSelectedModelId]    = useState<string>(vehicle?.modelId ?? '');
  const [selectedFuelTypeId, setSelectedFuelTypeId] = useState<string>(vehicle?.fuelTypeId ?? '');

  // Fallback text values (used when catalog is empty)
  const [manualBrand, setManualBrand] = useState<string>(vehicle?.brand ?? '');
  const [manualModel, setManualModel] = useState<string>(vehicle?.model ?? '');

  // Load brands and fuel types on mount
  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setCatalogLoading(true);
      try {
        const [brandsRes, fuelRes] = await Promise.all([
          catalogApi.getBrands(token),
          catalogApi.getFuelTypes(token),
        ]);
        const activeBrands = brandsRes.data.filter((b) => b.isActive);
        setBrands(activeBrands);
        setFuelTypes(fuelRes.data.filter((f) => f.isActive));
        setCatalogEmpty(activeBrands.length === 0);
      } catch {
        setCatalogEmpty(true);
      } finally {
        setCatalogLoading(false);
      }
    };

    load();
  }, [token]);

  // Load models when brand selection changes
  useEffect(() => {
    if (!token || !selectedBrandId) {
      setModels([]);
      return;
    }

    catalogApi
      .getModels(token, selectedBrandId)
      .then((res) => setModels(res.data.filter((m) => m.isActive)))
      .catch(() => setModels([]));
  }, [token, selectedBrandId]);

  // When editing: if brand is set but no brandId yet, models need to stay empty
  // (user must re-select from catalog to link the FK)

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedModelId(''); // reset model when brand changes
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Build payload — always send both text and FK fields
    const plate       = formData.get('plate') as string;
    const vehicleType = formData.get('vehicleType') as string;
    const color       = formData.get('color') as string;
    const yearRaw     = formData.get('year') as string;

    // Determine brand/model text: prefer catalog name, fall back to manual input
    const brandObj = brands.find((b) => b.id === selectedBrandId);
    const modelObj = models.find((m) => m.id === selectedModelId);

    const brandText = catalogEmpty
      ? manualBrand.trim()
      : (brandObj?.name ?? manualBrand.trim());

    const modelText = catalogEmpty
      ? manualModel.trim()
      : (modelObj?.name ?? manualModel.trim());

    if (!brandText) { setError('Selecciona o ingresa una marca.'); setIsSubmitting(false); return; }
    if (!modelText) { setError('Selecciona o ingresa un modelo.'); setIsSubmitting(false); return; }

    const data = {
      brand:      brandText,
      model:      modelText,
      plate,
      year:       yearRaw ? parseInt(yearRaw) : undefined,
      color:      color || undefined,
      vehicleType,
      ownerName:  user?.name  ?? '',
      ownerPhone: user?.phone ?? undefined,
      brandId:    selectedBrandId   || null,
      modelId:    selectedModelId   || null,
      fuelTypeId: selectedFuelTypeId || null,
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
            {/* Brand */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Marca *
              </label>
              {catalogLoading ? (
                <div className={`${selectClass} flex items-center gap-2 text-slate-400`}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando marcas...
                </div>
              ) : catalogEmpty ? (
                <>
                  <input
                    type="text"
                    value={manualBrand}
                    onChange={(e) => setManualBrand(e.target.value)}
                    placeholder="Toyota, Honda, Ford..."
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No hay marcas en el catálogo. Ingresa manualmente.
                  </p>
                </>
              ) : (
                <>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Selecciona una marca</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {vehicle && !vehicle.brandId && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Antes: {vehicle.brand}. Selecciona del catálogo para actualizar.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Modelo *
              </label>
              {catalogLoading ? (
                <div className={`${selectClass} flex items-center gap-2 text-slate-400`}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando modelos...
                </div>
              ) : catalogEmpty ? (
                <>
                  <input
                    type="text"
                    value={manualModel}
                    onChange={(e) => setManualModel(e.target.value)}
                    placeholder="Corolla, Civic, Focus..."
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No hay modelos en el catálogo. Ingresa manualmente.
                  </p>
                </>
              ) : (
                <>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    disabled={!selectedBrandId}
                    className={selectClass}
                  >
                    <option value="">
                      {selectedBrandId ? 'Selecciona un modelo' : 'Selecciona primero una marca'}
                    </option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {vehicle && !vehicle.modelId && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Antes: {vehicle.model}. Selecciona del catálogo para actualizar.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Plate */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Placas *
              </label>
              <input
                type="text"
                name="plate"
                defaultValue={vehicle?.plate}
                required
                pattern="[A-Z]{3}-\d{4}"
                placeholder="ABC-1234"
                className={`${inputClass} uppercase`}
              />
            </div>

            {/* Year */}
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
                className={inputClass}
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                defaultValue={vehicle?.color || ''}
                placeholder="Blanco, Negro, Rojo..."
                className={inputClass}
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Vehículo *
              </label>
              <select
                name="vehicleType"
                defaultValue={vehicle?.vehicleType}
                required
                className={selectClass}
              >
                <option value="">Selecciona un tipo</option>
                {vehicleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fuel Type (optional) */}
            {!catalogEmpty && fuelTypes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Combustible
                </label>
                <select
                  value={selectedFuelTypeId}
                  onChange={(e) => setSelectedFuelTypeId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Sin especificar</option>
                  {fuelTypes.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}
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
