'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, DollarSign, Calendar, Clock, Car, User, Filter, Search } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

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

// Nielsen: Reconocer antes que recordar - Estados con colores semánticos
const statusConfig = {
  PENDING: {
    variant: 'warning' as const,
    label: 'Pendiente',
    description: 'Esperando confirmación',
  },
  CONFIRMED: {
    variant: 'info' as const,
    label: 'Confirmada',
    description: 'Lista para el servicio',
  },
  IN_PROGRESS: {
    variant: 'primary' as const,
    label: 'En Proceso',
    description: 'Servicio en curso',
  },
  COMPLETED: {
    variant: 'success' as const,
    label: 'Completada',
    description: 'Servicio finalizado',
  },
  CANCELLED: {
    variant: 'error' as const,
    label: 'Cancelada',
    description: 'Reserva cancelada',
  },
};

export default function ReservationsTable({ initialReservations }: { initialReservations: any[] }) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    reservationId: '',
    vehicleInfo: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Nielsen: Flexibilidad y eficiencia - Filtros y búsqueda
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.vehicle.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.service.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || reservation.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Nielsen: Prevención de errores - Confirmación antes de eliminar
  const handleDeleteClick = (id: string, vehicleInfo: string) => {
    setConfirmModal({
      isOpen: true,
      reservationId: id,
      vehicleInfo,
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const { reservationId: id } = confirmModal;

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setReservations(reservations.filter(r => r.id !== id));
        // Nielsen: Visibilidad del estado del sistema
        setToast({
          isOpen: true,
          title: 'Reserva eliminada',
          message: 'La reserva ha sido eliminada exitosamente',
          type: 'success',
        });
      } else {
        const error = await res.json();
        // Nielsen: Ayudar a reconocer y corregir errores
        setToast({
          isOpen: true,
          title: 'Error al eliminar',
          message: error.error || 'No se pudo eliminar la reserva. Intenta de nuevo.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({
        isOpen: true,
        title: 'Error del sistema',
        message: 'No se pudo conectar con el servidor',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, reservationId: '', vehicleInfo: '' });
    }
  };

  return (
    <section className="space-y-6">
      {/* Header con acción principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mis Reservas</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestiona y consulta todas tus reservas de autolavado
          </p>
        </div>
        
        {/* Nielsen: Consistencia - Acción primaria destacada */}
        <Link href="/dashboard/reservas/nueva">
          <Button size="lg" className="shadow-lg">
            <Plus className="w-5 h-5" />
            Nueva Reserva
          </Button>
        </Link>
      </div>

      {/* Nielsen: Flexibilidad y eficiencia - Filtros */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
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

          {/* Filtro por estado */}
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
        
        {/* Nielsen: Visibilidad del estado - Contador de resultados */}
        <div className="mt-4 pt-4 border-t border-cyan-100 dark:border-slate-600">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando <span className="font-semibold text-cyan-600 dark:text-cyan-400">{filteredReservations.length}</span> de {reservations.length} reservas
          </p>
        </div>
      </Card>

      {/* Nielsen: Diseño estético y minimalista - Vista de tarjetas en lugar de tabla */}
      {filteredReservations.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {searchTerm || filterStatus !== 'ALL' 
              ? 'No se encontraron reservas'
              : 'No tienes reservas registradas'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchTerm || filterStatus !== 'ALL'
              ? 'Intenta con otros criterios de búsqueda'
              : 'Crea tu primera reserva para comenzar'}
          </p>
          {!searchTerm && filterStatus === 'ALL' && (
            <Link href="/dashboard/reservas/nueva">
              <Button>
                <Plus className="w-5 h-5" />
                Crear Primera Reserva
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredReservations.map((reservation) => {
            const config = statusConfig[reservation.status];
            return (
              <Card key={reservation.id} hover className="group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={config.variant} size="md">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{config.description}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {reservation.service.name}
                    </h3>
                  </div>
                  
                  {/* Nielsen: Diseño estético - Monto destacado */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      ${reservation.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Información del vehículo y cliente */}
                <div className="space-y-3 mb-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {reservation.vehicle.ownerName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Car className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">
                      {reservation.vehicle.brand} {reservation.vehicle.model}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {reservation.vehicle.plate}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {new Date(reservation.scheduledDate).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {reservation.scheduledTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nielsen: Control y libertad - Acciones claramente visibles */}
                <div className="flex gap-2 pt-4 border-t border-cyan-100 dark:border-slate-600">
                  <Link href={`/dashboard/pagos/${reservation.id}`} className="flex-1">
                    <Button variant="secondary" fullWidth size="sm">
                      <DollarSign className="w-4 h-4" />
                      Pagar
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(
                      reservation.id,
                      `${reservation.vehicle.brand} ${reservation.vehicle.plate}`
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
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
    </section>
  );
}
