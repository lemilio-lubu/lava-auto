'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { reservationApi, paymentApi } from '@/lib/api-client';
import { ArrowLeft, CreditCard, Banknote, Loader2, Check, Clock, Car, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import PaymentModal from '@/components/payment/PaymentModal';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [reservation, setReservation] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const reservationId = params.id as string;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [reservationData, paymentsData] = await Promise.all([
          reservationApi.getById(reservationId, token),
          paymentApi.getByReservation(reservationId, token),
        ]);
        setReservation(reservationData);
        setPayments(paymentsData);
      } catch (err: any) {
        setError(err.message || 'Error al cargar la información');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, token, authLoading, router, reservationId]);

  const handlePaymentSuccess = (payment: any) => {
    setPayments([payment, ...payments]);
    setShowPaymentModal(false);
    // Refresh reservation data
    if (token) {
      reservationApi.getById(reservationId, token).then(setReservation);
    }
  };

  const isPaid = payments.some(p => p.status === 'COMPLETED');

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-800 dark:text-red-200">{error || 'Reserva no encontrada'}</p>
          <Link href="/dashboard/client" className="text-cyan-600 hover:underline mt-4 inline-block">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pago de Reserva</h1>
          <p className="text-slate-600 dark:text-slate-400">Completa el pago de tu servicio</p>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 p-6 text-white">
          <h2 className="text-xl font-bold mb-1">{reservation.serviceName || 'Servicio de Lavado'}</h2>
          <p className="text-cyan-100">Reserva #{reservation.id.slice(-8)}</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Calendar className="w-5 h-5" />
            <span>
              {new Date(reservation.scheduledDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Clock className="w-5 h-5" />
            <span>{reservation.scheduledTime}</span>
          </div>
          
          {reservation.address && (
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <MapPin className="w-5 h-5" />
              <span>{reservation.address}</span>
            </div>
          )}

          {reservation.vehicle && (
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Car className="w-5 h-5" />
              <span>{reservation.vehicle.brand} {reservation.vehicle.model} - {reservation.vehicle.plate}</span>
            </div>
          )}
          
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">Total a pagar:</span>
              <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                ${Number(reservation.totalAmount).toFixed(2)} MXN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      {isPaid ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-200">¡Pago completado!</h3>
              <p className="text-green-700 dark:text-green-300">Tu reserva ha sido pagada exitosamente</p>
            </div>
          </div>
        </div>
      ) : (
        /* Payment Options */
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Método de Pago</h3>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Tarjeta de Crédito/Débito</h4>
                <p className="text-slate-600 dark:text-slate-400">Paga de forma segura con tu tarjeta</p>
              </div>
              <div className="text-cyan-500">
                <span className="text-sm font-medium bg-cyan-100 dark:bg-cyan-900/30 px-3 py-1 rounded-full">
                  Recomendado
                </span>
              </div>
            </div>
          </button>

          <div className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Banknote className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Pago en Efectivo</h4>
                <p className="text-slate-600 dark:text-slate-400">Paga al lavador al finalizar el servicio</p>
              </div>
              <div className="text-slate-400">
                <span className="text-sm font-medium">Próximamente</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Historial de Pagos</h3>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    payment.status === 'COMPLETED' ? 'bg-green-500' :
                    payment.status === 'PENDING' ? 'bg-amber-500' :
                    payment.status === 'FAILED' ? 'bg-red-500' :
                    'bg-slate-500'
                  }`} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {payment.paymentMethod === 'CARD' ? 'Tarjeta' : 
                       payment.paymentMethod === 'CASH' ? 'Efectivo' : payment.paymentMethod}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(payment.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">
                    ${Number(payment.amount).toFixed(2)}
                  </p>
                  <p className={`text-sm ${
                    payment.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
                    payment.status === 'PENDING' ? 'text-amber-600 dark:text-amber-400' :
                    payment.status === 'FAILED' ? 'text-red-600 dark:text-red-400' :
                    'text-slate-600 dark:text-slate-400'
                  }`}>
                    {payment.status === 'COMPLETED' ? 'Completado' :
                     payment.status === 'PENDING' ? 'Pendiente' :
                     payment.status === 'FAILED' ? 'Fallido' :
                     payment.status === 'REFUNDED' ? 'Reembolsado' : payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {token && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          reservationId={reservationId}
          amount={Number(reservation.totalAmount)}
          serviceName={reservation.serviceName || 'Servicio de Lavado'}
          token={token}
        />
      )}
    </div>
  );
}
