'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Reservation = {
  id: string;
  scheduledDate: Date;
  scheduledTime: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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

export default function ReservationsTable({ initialReservations }: { initialReservations: any[] }) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta reserva?')) return;

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReservations(reservations.filter(r => r.id !== id));
      } else {
        const error = await res.json();
        alert(error.error || 'Error al eliminar reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar reserva');
    }
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reservas</h1>
        <Link 
          href="/dashboard/reservas/nueva"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Nueva Reserva
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No tienes reservas registradas
                </td>
              </tr>
            ) : (
              reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.vehicle.ownerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reservation.vehicle.brand} {reservation.vehicle.model} - {reservation.vehicle.plate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reservation.service.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(reservation.scheduledDate).toLocaleDateString()} - {reservation.scheduledTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reservation.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[reservation.status]}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/pagos/${reservation.id}`}
                        className="text-green-600 hover:text-green-800"
                      >
                        Pagar
                      </Link>
                      <button
                        onClick={() => handleDelete(reservation.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
