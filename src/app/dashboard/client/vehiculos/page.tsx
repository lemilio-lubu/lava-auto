'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import VehicleList from '@/components/vehicles/VehicleList';
import { vehicleApi } from '@/lib/api-client';

export default function VehiculosPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'CLIENT') {
      router.push('/dashboard');
      return;
    }

    if (token) {
      vehicleApi.getAll(token)
        .then(setVehicles)
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
            Mis Vehículos
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Administra los vehículos registrados en tu cuenta
          </p>
        </div>
      </div>

      <VehicleList vehicles={vehicles} />

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
          Información sobre tus Vehículos
        </h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Puedes registrar múltiples vehículos en tu cuenta
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Cada vehículo debe tener una placa única
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Al solicitar un servicio, seleccionarás qué vehículo deseas lavar
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-600 dark:text-cyan-400">•</span>
            <span>
              Los datos de tus vehículos se mantienen privados y seguros
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
