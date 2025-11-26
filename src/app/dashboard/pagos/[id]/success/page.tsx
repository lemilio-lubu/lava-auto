'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [paymentDate] = useState(new Date());

  useEffect(() => {
    // Verificar y actualizar el pago cuando se carga la página de éxito
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          // Llamar a una API para verificar y actualizar el estado del pago
          const response = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          
          if (response.ok) {
            console.log('Pago verificado y actualizado correctamente');
          }
        } catch (error) {
          console.error('Error al verificar pago:', error);
        }
      }
      setTimeout(() => setLoading(false), 1500);
    };

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-cyan-200/30 dark:border-slate-600/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-600 dark:border-t-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute inset-3 border-4 border-transparent border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300 animate-pulse">Verificando pago...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <Card className="max-w-lg w-full shadow-2xl border-2 border-emerald-100 dark:border-emerald-900/50">
        <CardContent className="text-center py-16 px-8">
          {/* Animated Success Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto relative">
              {/* Outer glow circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600 rounded-full opacity-20 animate-ping"></div>
              
              {/* Main circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-full shadow-lg"></div>
              
              {/* Inner lighter circle */}
              <div className="absolute inset-2 bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-600 rounded-full"></div>
              
              {/* Checkmark */}
              <svg 
                className="absolute inset-0 w-full h-full p-8 text-white animate-[scale-in_0.5s_ease-out]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="3"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M5 13l4 4L19 7"
                  className="animate-[draw_0.5s_ease-out_0.2s_both]"
                  style={{
                    strokeDasharray: '30',
                    strokeDashoffset: '30',
                  }}
                />
              </svg>
            </div>
            
            {/* Confetti circles */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
              <div className="absolute top-0 left-1/4 w-3 h-3 bg-emerald-400 rounded-full animate-[float-up_1s_ease-out]"></div>
              <div className="absolute top-0 right-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-[float-up_1.2s_ease-out]"></div>
              <div className="absolute top-4 left-1/3 w-2 h-2 bg-green-400 rounded-full animate-[float-up_0.8s_ease-out]"></div>
              <div className="absolute top-4 right-1/3 w-3 h-3 bg-teal-400 rounded-full animate-[float-up_1.1s_ease-out]"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent mb-3">
            ¡Pago Exitoso!
          </h1>
          
          <div className="mb-8">
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">
              Tu pago ha sido procesado correctamente
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Recibirás un correo de confirmación en breve
            </p>
          </div>

          {/* Payment Details Card */}
          <div className="mb-8 space-y-3">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Estado del Pago</p>
                </div>
                <span className="px-3 py-1 bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-bold rounded-full">
                  COMPLETADO
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Fecha y Hora</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {paymentDate.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {paymentDate.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Método de Pago</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="font-semibold text-slate-900 dark:text-white">Tarjeta de Crédito/Débito</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Comprobante de Pago</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Se ha enviado un comprobante de pago a tu correo electrónico con todos los detalles de la transacción.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push('/dashboard')}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 dark:from-emerald-500 dark:to-green-500 dark:hover:from-emerald-600 dark:hover:to-green-600 shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ir al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
