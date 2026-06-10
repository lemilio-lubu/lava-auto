'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import ReservationsTable from '@/components/reservas/ReservationsTable';
import { reservationApi, vehicleApi, serviceApi, paymentApi, type Vehicle, type Service, type Reservation, type Payment } from '@/lib/api-client';
import { logger } from '@/lib/logger';

export default function ReservasPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Map<string, Payment>>(new Map());
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
      const [reservationsData, vehiclesData, servicesData, paymentsData] = await Promise.all([
        reservationApi.getMyReservations(token),
        vehicleApi.getAll(token),
        serviceApi.getAll(token),
        paymentApi.getAll(token).catch(() => []),
      ]);
      setReservations(reservationsData);
      setVehicles(vehiclesData);
      setServices(servicesData);
      // Build map: reservationId → most relevant payment
      const map = new Map<string, Payment>();
      (paymentsData as Payment[]).forEach((payment) => {
        const existing = map.get(payment.reservationId);
        // Prefer COMPLETED over any other status
        if (!existing || payment.status === 'COMPLETED') {
          map.set(payment.reservationId, payment);
        }
      });
      setPaymentsMap(map);
    } catch (error) {
      logger.error('Error cargando reservas del cliente', error);
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
        paymentsMap={paymentsMap}
        onUpdate={loadData}
        showHeader={false}
      />
    </div>
  );
}
