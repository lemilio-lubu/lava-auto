'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Filter, Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EditReservationModal from '@/components/reservas/EditReservationModal';
import ReservationCard from '@/components/reservas/ReservationCard';
import { reservationApi, type Reservation, type Vehicle, type Service, type Payment } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';


export default function ReservationsTable({
  reservations: initialReservations,
  vehicles = [],
  services = [],
  paymentsMap,
  onUpdate,
  showHeader = true,
}: {
  reservations: Reservation[];
  vehicles?: Vehicle[];
  services?: Service[];
  paymentsMap?: Map<string, Payment>;
  onUpdate?: () => void;
  showHeader?: boolean;
}) {
  const { token } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toast, setToast] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, reservationId: '', vehicleInfo: '' });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; reservation: Reservation | null }>({ isOpen: false, reservation: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setReservations(initialReservations || []);
  }, [initialReservations]);

  const filteredReservations = (reservations || []).filter((r) => {
    const matchesSearch =
      (r.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.vehicleId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.address?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesSearch && (filterStatus === 'ALL' || r.status === filterStatus);
  });

  const handleDeleteClick = (id: string, vehicleInfo: string) => {
    setConfirmModal({ isOpen: true, reservationId: id, vehicleInfo });
  };

  const handleEditClick = (reservation: Reservation) => {
    setEditModal({ isOpen: true, reservation });
  };

  const handleEditSuccess = () => {
    setToast({ isOpen: true, title: 'Reserva actualizada', message: 'La reserva ha sido actualizada exitosamente', type: 'success' });
    onUpdate?.();
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const { reservationId: id } = confirmModal;
    try {
      if (!token) throw new Error('No token');
      await reservationApi.cancel(id, token);
      setReservations(reservations.filter(r => r.id !== id));
      onUpdate?.();
      setToast({ isOpen: true, title: 'Reserva eliminada', message: 'La reserva ha sido eliminada exitosamente', type: 'success' });
    } catch (error: unknown) {
      logger.error('Error eliminando la reserva', error);
      setToast({ isOpen: true, title: 'Error al eliminar', message: error instanceof Error ? error.message : 'No se pudo eliminar la reserva. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, reservationId: '', vehicleInfo: '' });
    }
  };

  return (
    <section className="space-y-6">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mis Reservas</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona y consulta todas tus reservas de servicio</p>
          </div>
          <Link href="/dashboard/reservas/nueva">
            <Button size="lg" className="shadow-lg">
              <Plus className="w-5 h-5" />
              Nueva Reserva
            </Button>
          </Link>
        </div>
      )}

      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por cliente, placa o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border-2 border-cyan-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border-2 border-cyan-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="IN_PROGRESS">En Proceso</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-cyan-100 dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando <span className="font-semibold text-cyan-600 dark:text-cyan-400">{filteredReservations.length}</span> de {reservations.length} reservas
          </p>
        </div>
      </Card>

      {filteredReservations.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {searchTerm || filterStatus !== 'ALL' ? 'No se encontraron reservas' : 'No tienes reservas registradas'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchTerm || filterStatus !== 'ALL' ? 'Intenta con otros criterios de búsqueda' : 'No tienes reservas registradas'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              payment={paymentsMap?.get(reservation.id)}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, reservationId: '', vehicleInfo: '' })}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar reserva?"
        message={`¿Estás seguro de eliminar la reserva de ${confirmModal.vehicleInfo}? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />

      {editModal.reservation && (
        <EditReservationModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, reservation: null })}
          reservation={editModal.reservation}
          vehicles={vehicles}
          services={services}
          onSuccess={handleEditSuccess}
        />
      )}
    </section>
  );
}
