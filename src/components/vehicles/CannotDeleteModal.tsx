'use client';

import { X, AlertCircle } from 'lucide-react';

interface CannotDeleteModalProps {
  vehicleName: string;
  onClose: () => void;
}

export default function CannotDeleteModal({
  vehicleName,
  onClose,
}: CannotDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              No se puede eliminar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            No puedes eliminar el vehículo{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {vehicleName}
            </span>{' '}
            porque tiene reservas activas asociadas.
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
              ¿Qué puedes hacer?
            </h3>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
              <li className="flex gap-2">
                <span>•</span>
                <span>Espera a que se completen las reservas pendientes</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Cancela las reservas activas si es necesario</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Una vez sin reservas activas, podrás eliminar el vehículo</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
