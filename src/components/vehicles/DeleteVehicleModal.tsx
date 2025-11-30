'use client';

import { X } from 'lucide-react';

interface DeleteVehicleModalProps {
  vehicleName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function DeleteVehicleModal({
  vehicleName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteVehicleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Confirmar Eliminación
          </h2>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-300 mb-4">
            ¿Estás seguro de que deseas eliminar el vehículo{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {vehicleName}
            </span>
            ?
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            ⚠️ Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Vehículo'}
          </button>
        </div>
      </div>
    </div>
  );
}
