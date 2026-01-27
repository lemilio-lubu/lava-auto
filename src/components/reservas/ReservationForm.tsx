'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Car as CarIcon } from 'lucide-react';
import LocationPicker from '@/components/maps/LocationPicker';
import { reservationApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  color: string | null;
  vehicleType: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  vehicleType: string;
}

interface ReservationFormProps {
  vehicles: Vehicle[];
  services: Service[];
  defaultAddress: string;
}

export default function ReservationForm({
  vehicles,
  services,
  defaultAddress,
}: ReservationFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Get selected vehicle to filter services
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  
  // Filter services by vehicle type
  const filteredServices = selectedVehicle 
    ? services.filter(s => s.vehicleType === selectedVehicle.vehicleType)
    : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!token) {
      setError('Debes iniciar sesión para crear una reserva');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      vehicleId: formData.get('vehicleId') as string,
      serviceId: formData.get('serviceId') as string,
      scheduledDate: formData.get('scheduledDate') as string,
      scheduledTime: formData.get('scheduledTime') as string,
      address: formData.get('address') as string,
      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined,
      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined,
      notes: formData.get('notes') as string || undefined,
    };

    try {
      await reservationApi.create(data, token);

      router.push('/dashboard/client?success=reservation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CarIcon className="w-5 h-5" />
          Selecciona tu Vehículo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <label
              key={vehicle.id}
              className="flex items-center gap-4 p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50 dark:has-[:checked]:bg-cyan-900/20"
            >
              <input
                type="radio"
                name="vehicleId"
                value={vehicle.id}
                required
                className="w-5 h-5"
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {vehicle.brand} {vehicle.model}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {vehicle.plate} - {vehicle.color}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Selecciona el Servicio
        </h2>
        {!selectedVehicleId ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            Primero selecciona un vehículo para ver los servicios disponibles
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No hay servicios disponibles para este tipo de vehículo
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <label
                key={service.id}
                className="flex flex-col p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/20"
              >
                <input
                  type="radio"
                  name="serviceId"
                  value={service.id}
                  required
                  className="mb-3"
                />
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {service.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 flex-1">
                  {service.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {service.duration} min
                  </span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${service.price.toFixed(0)}
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Fecha y Hora
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Fecha del Servicio
            </label>
            <input
              type="date"
              name="scheduledDate"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Hora Preferida
            </label>
            <select
              name="scheduledTime"
              required
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Selecciona una hora</option>
              {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                <option key={hour} value={`${hour}:00`}>
                  {hour}:00 {hour < 12 ? 'AM' : 'PM'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <LocationPicker defaultAddress={defaultAddress} />
        
        <div className="mt-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Notas Adicionales (opcional)
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Indica cualquier detalle importante (ej: portón de color azul, piso 3)"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-4 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-center"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Procesando...' : 'Solicitar Lavado'}
        </button>
      </div>
    </form>
  );
}
