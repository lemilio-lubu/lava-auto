'use client';

import { useEffect, useState } from 'react';
import  Card  from '@/components/ui/Card';
import  Button  from '@/components/ui/Button';
import { vehicleApi, Vehicle } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function GarajeVirtual() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchVehicles();
  }, [token]);

  const fetchVehicles = async () => {
    if (!token) return;
    try {
      const data = await vehicleApi.getAll(token);
      setVehicles(data);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando garaje...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🚗 Mi Garaje Virtual</h2>
        <Button>+ Agregar Vehículo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-sm text-gray-600">{vehicle.plate}</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {vehicle.vehicleType}
              </span>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">
                Ver Historial
              </Button>
              <Button size="sm" className="flex-1">
                Reservar Lavado
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No tienes vehículos registrados</p>
          <Button>Agregar mi primer vehículo</Button>
        </div>
      )}
    </div>
  );
}
