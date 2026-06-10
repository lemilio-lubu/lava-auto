'use client';

import Link from 'next/link';
import { Edit, Trash2, Car as CarIcon } from 'lucide-react';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year?: number | null;
  color: string | null;
  vehicleType: string;
  hasActiveReservations?: boolean;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  deletingId: string | null;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, deletingId, onEdit, onDelete }: VehicleCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
          <CarIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(vehicle)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Editar vehículo"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(vehicle)}
            disabled={deletingId === vehicle.id}
            className={`p-2 rounded-lg transition-colors ${
              vehicle.hasActiveReservations
                ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            } disabled:opacity-50`}
            title={
              vehicle.hasActiveReservations
                ? 'No se puede eliminar: tiene reservas activas'
                : 'Eliminar vehículo'
            }
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        {vehicle.brand} {vehicle.model}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{vehicle.year}</p>

      <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Placa</span>
          <span className="font-semibold text-slate-900 dark:text-white">{vehicle.plate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Color</span>
          <span className="font-semibold text-slate-900 dark:text-white">{vehicle.color}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Tipo</span>
          <span className="font-semibold text-slate-900 dark:text-white">{vehicle.vehicleType}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Link
          href={`/dashboard/client/nueva-reserva?vehicleId=${vehicle.id}`}
          className="block w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Solicitar Servicio
        </Link>
      </div>
    </div>
  );
}
