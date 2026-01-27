'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ReservationForm from '@/components/reservas/ReservationForm';
import { vehicleApi, serviceApi } from '@/lib/api-client';

export default function NuevaReservaPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'CLIENT') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      Promise.all([
        vehicleApi.getAll(token),
        serviceApi.getAll(token)
      ])
        .then(([vehiclesData, servicesData]) => {
          setVehicles(vehiclesData);
          setServices(servicesData.filter((s: any) => s.isActive));
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user, token, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/client"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Solicitar Nuevo Lavado
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Completa el formulario para solicitar un servicio a domicilio
          </p>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
            No tienes vehículos registrados
          </h3>
          <p className="text-amber-800 dark:text-amber-200 mb-4">
            Primero debes registrar al menos un vehículo antes de solicitar un servicio
          </p>
          <Link
            href="/dashboard/client/vehiculos"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Registrar mi primer vehículo
          </Link>
        </div>
      ) : (
        <ReservationForm
          vehicles={vehicles}
          services={services}
          defaultAddress=""
        />
      )}
    </div>
  );
}
