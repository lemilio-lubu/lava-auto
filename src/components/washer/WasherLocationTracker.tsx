'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, X } from 'lucide-react';

export default function WasherLocationTracker() {
  const { data: session, status } = useSession();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Solo ejecutar para lavadores autenticados
    if (status === 'authenticated' && session?.user?.role === 'WASHER') {
      requestLocation();
    }
  }, [status, session]);

  const requestLocation = () => {
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      setErrorMessage('Tu navegador no soporta geolocalización');
      setLocationStatus('error');
      setShowPrompt(true);
      return;
    }

    setLocationStatus('requesting');
    setShowPrompt(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Enviar ubicación al servidor
          const response = await fetch('/api/auth/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!response.ok) {
            throw new Error('Error al actualizar ubicación');
          }

          setLocationStatus('success');
          // Ocultar el mensaje después de 3 segundos
          setTimeout(() => setShowPrompt(false), 3000);
        } catch (error) {
          console.error('Error al enviar ubicación:', error);
          setErrorMessage('Error al actualizar tu ubicación en el servidor');
          setLocationStatus('error');
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        let message = 'Error al obtener tu ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado. Por favor, habilita el acceso a tu ubicación en la configuración del navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible. Verifica tu conexión GPS.';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }
        
        setErrorMessage(message);
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRetry = () => {
    setLocationStatus('idle');
    setErrorMessage('');
    requestLocation();
  };

  // No mostrar nada si no es lavador o no hay nada que mostrar
  if (status !== 'authenticated' || session?.user?.role !== 'WASHER' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {locationStatus === 'requesting' && (
        <div className="bg-cyan-50 dark:bg-cyan-900/90 border border-cyan-200 dark:border-cyan-700 rounded-lg shadow-lg p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-cyan-900 dark:text-cyan-100 mb-1">
                Obteniendo tu ubicación...
              </p>
              <p className="text-sm text-cyan-700 dark:text-cyan-300">
                Por favor, permite el acceso a tu ubicación para recibir trabajos cercanos.
              </p>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {locationStatus === 'success' && (
        <div className="bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-700 rounded-lg shadow-lg p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                ✅ Ubicación actualizada
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Ahora recibirás trabajos cercanos a tu ubicación actual.
              </p>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {locationStatus === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-700 rounded-lg shadow-lg p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                ⚠️ Error de ubicación
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {errorMessage}
              </p>
              <button
                onClick={handleRetry}
                className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                Intentar nuevamente
              </button>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
