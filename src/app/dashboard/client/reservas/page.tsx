'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import ReservationsTable from '@/components/reservas/ReservationsTable';
import { reservationApi, vehicleApi, serviceApi, Vehicle, Service } from '@/lib/api-client';

export default function ReservasPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'CLIENT') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [user, token, authLoading, router]);

  const loadData = async () => {
    if (!token) return;
    try {
      const [reservationsData, vehiclesData, servicesData] = await Promise.all([
        reservationApi.getMyReservations(token),
        vehicleApi.getAll(token),
        serviceApi.getAll(token),
      ]);
      setReservations(reservationsData);
      setVehicles(vehiclesData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Reservas</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Historial completo de tus servicios de lavado
        </p>
      </div>

      <ReservationsTable 
        reservations={reservations} 
        vehicles={vehicles}
        services={services}
        onUpdate={loadData}
        showHeader={false}
      />
    </div>
  );
}
