'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import { reservationApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import LocationPicker from '@/components/maps/LocationPicker';

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

interface Reservation {
  id: string;
  vehicleId: string;
  serviceId: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  status: string;
}

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  vehicles: Vehicle[];
  services: Service[];
  onSuccess: () => void;
}

export default function EditReservationModal({
  isOpen,
  onClose,
  reservation,
  vehicles,
  services,
  onSuccess,
}: EditReservationModalProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vehicleId: reservation.vehicleId,
    serviceId: reservation.serviceId,
    scheduledDate: reservation.scheduledDate?.split('T')[0] || '',
    scheduledTime: reservation.scheduledTime || '',
    address: reservation.address || '',
    latitude: reservation.latitude,
    longitude: reservation.longitude,
    notes: reservation.notes || '',
  });

  // Actualizar formData cuando cambia la reservación
  useEffect(() => {
    if (reservation) {
      setFormData({
        vehicleId: reservation.vehicleId,
        serviceId: reservation.serviceId,
        scheduledDate: reservation.scheduledDate?.split('T')[0] || '',
        scheduledTime: reservation.scheduledTime || '',
        address: reservation.address || '',
        latitude: reservation.latitude,
        longitude: reservation.longitude,
        notes: reservation.notes || '',
      });
    }
  }, [reservation]);

  // Get selected vehicle to filter services
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  
  // Filter services by vehicle type
  const filteredServices = selectedVehicle 
    ? services.filter(s => s.vehicleType === selectedVehicle.vehicleType)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!token) {
      setError('Debes iniciar sesión para editar la reserva');
      setIsSubmitting(false);
      return;
    }

    try {
      await reservationApi.update(reservation.id, {
        vehicleId: formData.vehicleId,
        serviceId: formData.serviceId,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        notes: formData.notes || undefined,
      }, token);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationChange = (location: { address: string; latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Editar Reserva
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Vehículo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Vehículo
            </label>
            <select
              value={formData.vehicleId}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, vehicleId: e.target.value, serviceId: '' }));
              }}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="">Selecciona un vehículo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} - {vehicle.plate}
                </option>
              ))}
            </select>
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Servicio
            </label>
            {!formData.vehicleId ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Primero selecciona un vehículo
              </p>
            ) : filteredServices.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No hay servicios disponibles para este tipo de vehículo
              </p>
            ) : (
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
                required
              >
                <option value="">Selecciona un servicio</option>
                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.price.toFixed(0)} ({service.duration} min)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Hora
              </label>
              <select
                value={formData.scheduledTime}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
                required
              >
                <option value="">Selecciona una hora</option>
                {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                  <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                    {hour.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Ubicación
            </label>
            <LocationPicker
              onLocationChange={handleLocationChange}
              defaultAddress={formData.address}
              defaultLat={formData.latitude}
              defaultLng={formData.longitude}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notas adicionales (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white resize-none"
              placeholder="Instrucciones especiales, acceso, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.vehicleId || !formData.serviceId}
              className="flex-1"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
