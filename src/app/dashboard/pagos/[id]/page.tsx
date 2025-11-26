'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';

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
  const { modalState, showSuccess, showError, closeModal } = useModal();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionId: '',
    notes: '',
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
      showError('Error', 'El monto no puede ser mayor al saldo pendiente');
      return;
    }

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
        showSuccess('¡Éxito!', 'Pago registrado exitosamente');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        const error = await res.json();
        showError('Error', error.error || 'Error al registrar pago');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error', 'Error al registrar pago');
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-900">Cargando...</div>;
  }

  if (!reservation) {
    return <div className="p-6 text-gray-900">Reserva no encontrada</div>;
  }

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Registrar Pago</h1>
        <p className="text-gray-600">Complete el formulario para registrar un pago</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la Reserva */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Información de la Reserva</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-medium text-gray-900">{reservation.vehicle.ownerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vehículo</p>
              <p className="font-medium text-gray-900">
                {reservation.vehicle.brand} {reservation.vehicle.model} - {reservation.vehicle.plate}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Servicio</p>
              <p className="font-medium text-gray-900">{reservation.service.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha/Hora</p>
              <p className="font-medium text-gray-900">
                {new Date(reservation.scheduledDate).toLocaleDateString()} - {reservation.scheduledTime}
              </p>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium text-gray-900">${reservation.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Pagado:</span>
                <span className="font-medium text-green-600">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Saldo:</span>
                <span className="font-semibold text-red-600">${balance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Pago */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Registrar Pago</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Monto</label>
              <input
                type="number"
                required
                min="0.01"
                max={balance}
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">Máximo: ${balance.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Método de Pago</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
              >
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">ID de Transacción (opcional)</label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                placeholder="REF-12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Notas (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                placeholder="Notas adicionales..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={balance <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Registrar Pago
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Historial de Pagos */}
      {payments.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Historial de Pagos</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Transacción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paymentMethod}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.transactionId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    )}

    <Modal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
    />
  </section>
  );
}