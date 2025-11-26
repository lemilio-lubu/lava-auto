'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DollarSign, CreditCard, Calendar, User, Car as CarIcon, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';

type Reservation = {
  id: string;
  totalAmount: number;
  scheduledDate: Date;
  scheduledTime: string;
  vehicle: {
    ownerName: string;
    brand: string;
    model: string;
    plate: string;
  };
  service: {
    name: string;
  };
};

type Payment = {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId: string | null;
  createdAt: Date;
};

export default function RegistrarPagoPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionId: '',
    notes: '',
  });
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    fetchData();
  }, [reservationId]);

  const fetchData = async () => {
    try {
      const [resRes, paymentsRes] = await Promise.all([
        fetch(`/api/reservations?id=${reservationId}`),
        fetch(`/api/payments?reservationId=${reservationId}`),
      ]);

      if (resRes.ok) {
        const resData = await resRes.json();
        setReservation(Array.isArray(resData) ? resData[0] : resData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => p.status === 'COMPLETED' ? sum + p.amount : sum, 0);
  const balance = reservation ? reservation.totalAmount - totalPaid : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parseFloat(formData.amount) > balance) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'El monto no puede ser mayor al saldo pendiente',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          ...formData,
        }),
      });

      if (res.ok) {
        setToast({
          isOpen: true,
          title: '¡Éxito!',
          message: 'Pago registrado exitosamente',
          type: 'success',
        });
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        const error = await res.json();
        setToast({
          isOpen: true,
          title: 'Error',
          message: error.error || 'Error al registrar pago',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'Error al registrar pago',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-200 dark:border-slate-600 border-t-cyan-600 dark:border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando información del pago...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <DollarSign className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-900 dark:text-white font-semibold text-lg">Reserva no encontrada</p>
            <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6">No pudimos encontrar la reserva solicitada</p>
            <Button onClick={() => router.push('/dashboard')}>Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Registrar Pago</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Complete el formulario para registrar un pago de la reserva</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la Reserva */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle>Información de la Reserva</CardTitle>
                <CardDescription>Detalles del servicio y cliente</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cliente</p>
                  <p className="font-medium text-slate-900 dark:text-white">{reservation.vehicle.ownerName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <CarIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Vehículo</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                  <Badge variant="neutral" size="sm" className="mt-1">{reservation.vehicle.plate}</Badge>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Servicio</p>
                  <p className="font-medium text-slate-900 dark:text-white">{reservation.service.name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Fecha/Hora</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {new Date(reservation.scheduledDate).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{reservation.scheduledTime}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-cyan-100 dark:border-slate-600">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Total:</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-lg">${reservation.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Pagado:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg">${totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-cyan-100 dark:border-slate-600">
                    <span className="font-bold text-slate-900 dark:text-white">Saldo Pendiente:</span>
                    <span className="font-bold text-red-600 dark:text-red-400 text-2xl">${balance.toFixed(2)}</span>
                  </div>
                  {balance === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Pago completado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Pago */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>Registrar Pago</CardTitle>
                <CardDescription>Ingrese los datos del pago a registrar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto a Pagar</label>
              <input
                type="number"
                required
                min="0.01"
                max={balance}
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                placeholder="0.00"
                disabled={balance <= 0}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Saldo disponible: ${balance.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método de Pago</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                disabled={balance <= 0}
              >
                <option value="CASH">💵 Efectivo</option>
                <option value="CARD">💳 Tarjeta</option>
                <option value="TRANSFER">🏦 Transferencia</option>
                <option value="OTHER">📝 Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID de Transacción (opcional)</label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                placeholder="REF-12345"
                disabled={balance <= 0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas Adicionales (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all resize-none"
                placeholder="Notas adicionales sobre el pago..."
                rows={3}
                disabled={balance <= 0}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={balance <= 0 || isSubmitting}
                isLoading={isSubmitting}
              >
                {balance <= 0 ? 'Pago Completado' : 'Registrar Pago'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Pagos */}
      {payments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Registro de todos los pagos realizados para esta reserva</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID Transacción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-cyan-50/50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {new Date(payment.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {payment.paymentMethod === 'CASH' && '💵 Efectivo'}
                        {payment.paymentMethod === 'CARD' && '💳 Tarjeta'}
                        {payment.paymentMethod === 'TRANSFER' && '🏦 Transferencia'}
                        {payment.paymentMethod === 'OTHER' && '📝 Otro'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {payment.transactionId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge 
                          variant={payment.status === 'COMPLETED' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {payment.status === 'COMPLETED' ? 'Completado' : 'Pendiente'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </section>
  );
}