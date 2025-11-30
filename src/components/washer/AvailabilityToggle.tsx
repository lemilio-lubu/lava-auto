'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Pause } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface AvailabilityToggleProps {
  isAvailable: boolean;
  userName: string;
}

export default function AvailabilityToggle({ isAvailable, userName }: AvailabilityToggleProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/washers/toggle-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cambiar disponibilidad');
      }

      const data = await response.json();

      setToast({
        isOpen: true,
        title: data.isAvailable ? 'Ahora estás disponible' : 'Ahora estás inactivo',
        message: data.isAvailable
          ? 'Recibirás notificaciones de nuevos trabajos'
          : 'No recibirás trabajos hasta que te reactives',
        type: data.isAvailable ? 'success' : 'warning',
      });

      // Refrescar la página para actualizar el estado
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo cambiar tu disponibilidad. Intenta nuevamente.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`
        rounded-2xl p-8 text-white shadow-lg transition-all duration-300
        ${isAvailable 
          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
          : 'bg-gradient-to-r from-slate-500 to-slate-600'}
      `}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hola, {userName}</h1>
            <div className="flex items-center gap-2 text-green-50 text-lg">
              {isAvailable ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span>Estás DISPONIBLE para recibir trabajos</span>
                </>
              ) : (
                <>
                  <Pause className="w-6 h-6" />
                  <span>Estás INACTIVO - No recibirás trabajos nuevos</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg shadow-lg
              transition-all duration-200 hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isAvailable 
                ? 'bg-white text-green-600 hover:bg-green-50' 
                : 'bg-green-500 text-white hover:bg-green-600'}
            `}
          >
            {isLoading 
              ? 'Cambiando...' 
              : isAvailable ? 'Marcar No Disponible' : 'Marcar Disponible'}
          </button>
        </div>
      </div>

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
}
