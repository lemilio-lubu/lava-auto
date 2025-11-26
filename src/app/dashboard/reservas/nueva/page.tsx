'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Vehicle = {
  id: string;
  ownerName: string;
  brand: string;
  model: string;
  plate: string;
  vehicleType: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  vehicleType: string;
};

export default function NuevaReservaPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceId: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, servicesRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/services'),
      ]);

      const vehiclesData = await vehiclesRes.json();
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

      const servicesData = await servicesRes.json();
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    setFormData({ ...formData, vehicleId, serviceId: '' });
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      const vehicleServices = services.filter((s) => s.vehicleType === vehicle.vehicleType);
      setFilteredServices(vehicleServices);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert('Reserva creada exitosamente');
        router.push('/dashboard');
      } else {
        const error = await res.json();
        alert(error.error || 'Error al crear reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear reserva');
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-900">Cargando...</div>;
  }

  const selectedService = services.find((s) => s.id === formData.serviceId);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Nueva Reserva</h1>
        <p className="text-gray-600">Complete el formulario para crear una nueva reserva</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Vehículo</label>
            <select
              required
              value={formData.vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
            >
              <option value="">Seleccionar vehículo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} - {vehicle.plate} (Dueño: {vehicle.ownerName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Servicio</label>
            <select
              required
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              disabled={!formData.vehicleId}
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 text-gray-900 bg-white"
            >
              <option value="">Seleccionar servicio</option>
              {filteredServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price.toFixed(2)} ({service.duration} min)
                </option>
              ))}
            </select>
            {formData.vehicleId && filteredServices.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">No hay servicios disponibles para este tipo de vehículo</p>
            )}
          </div>

          {selectedService && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-900 mb-2">Detalles del Servicio</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Servicio:</strong> {selectedService.name}</p>
                <p><strong>Duración:</strong> {selectedService.duration} minutos</p>
                <p><strong>Precio:</strong> ${selectedService.price.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Fecha</label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Hora</label>
              <input
                type="time"
                required
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Notas (opcional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Crear Reserva
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
