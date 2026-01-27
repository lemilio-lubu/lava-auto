'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Calendar, User, Car, UserCheck, X } from 'lucide-react';
import { reservationApi, washerApi, adminApi } from '@/lib/api-client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

export default function ReservasAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [washers, setWashers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedWasher, setSelectedWasher] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [user, token, authLoading, router]);

  const loadData = async () => {
    if (!token) return;
    try {
      const [reservationsData, washersData, clientsData] = await Promise.all([
        reservationApi.getAllReservations(token),
        washerApi.getAll(token),
        adminApi.getUsers(token, 'CLIENT')
      ]);
      
      // Create a map of client IDs to names for quick lookup
      const clientMap = new Map<string, string>();
      clientsData?.forEach((client: any) => {
        clientMap.set(client.id, client.name);
      });
      
      // Also create a map of washer IDs to names
      const washerMap = new Map<string, string>();
      washersData?.forEach((washer: any) => {
        washerMap.set(washer.id, washer.name);
      });
      
      // Enrich reservations with client names
      const enrichedReservations = reservationsData.map((res: any) => ({
        ...res,
        clientName: clientMap.get(res.userId) || null,
        washerName: washerMap.get(res.washerId) || null
      }));
      
      setReservations(enrichedReservations);
      setWashers(washersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignModal = (reservation: any) => {
    setSelectedReservation(reservation);
    setSelectedWasher('');
    setShowAssignModal(true);
  };

  const handleAssignWasher = async () => {
    if (!token || !selectedReservation || !selectedWasher) return;

    setIsAssigning(true);
    try {
      await reservationApi.assignWasher(selectedReservation.id, selectedWasher, token);
      setToast({
        isOpen: true,
        title: 'Éxito',
        message: 'Lavador asignado correctamente',
        type: 'success',
      });
      setShowAssignModal(false);
      loadData();
    } catch (error: any) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Error al asignar lavador',
        type: 'error',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const filteredReservations = filter === 'ALL' 
    ? reservations 
    : reservations.filter(r => r.status === filter);

  // Filtrar washers disponibles para la fecha/hora de la reserva
  const getAvailableWashers = (reservation: any) => {
    // Por ahora mostrar todos los washers disponibles
    // TODO: Verificar disponibilidad en fecha/hora específica
    return washers.filter(w => w.isAvailable);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Todas las Reservas</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitorea y gestiona todas las reservas del sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-purple-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {status === 'ALL' ? 'Todas' : status} ({
              status === 'ALL' 
                ? reservations.length 
                : reservations.filter(r => r.status === status).length
            })
          </button>
        ))}
      </div>

      {/* Reservations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Fecha / Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Lavador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {reservation.serviceName || 'Servicio'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {reservation.address || 'Sin dirección'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Cliente: {reservation.clientName || reservation.userName || 'Cliente'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <div>{new Date(reservation.scheduledDate).toLocaleDateString('es-ES')}</div>
                        <div className="text-xs text-slate-500">{reservation.scheduledTime}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reservation.washerId ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {reservation.washerName || 'Lavador asignado'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      reservation.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      reservation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      reservation.status === 'CONFIRMED' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' :
                      reservation.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                    ${Number(reservation.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!reservation.washerId && reservation.status === 'PENDING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenAssignModal(reservation)}
                      >
                        <UserCheck className="w-4 h-4" />
                        Asignar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400">
            No hay reservas {filter !== 'ALL' && `con estado ${filter}`}
          </div>
        )}
      </div>

      {/* Modal de Asignar Washer */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Asignar Lavador
            </h2>
            <button
              onClick={() => setShowAssignModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {selectedReservation && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Detalles de la Reserva
                </h3>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p><strong>Servicio:</strong> {selectedReservation.serviceName}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedReservation.scheduledDate).toLocaleDateString('es-ES')}</p>
                  <p><strong>Hora:</strong> {selectedReservation.scheduledTime}</p>
                  <p><strong>Dirección:</strong> {selectedReservation.address || 'Sin dirección'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona un Lavador Disponible
                </label>
                <select
                  value={selectedWasher}
                  onChange={(e) => setSelectedWasher(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Selecciona un lavador --</option>
                  {getAvailableWashers(selectedReservation).map((washer) => (
                    <option key={washer.id} value={washer.id}>
                      {washer.name} - ⭐ {washer.rating.toFixed(1)} ({washer.completedServices} servicios)
                    </option>
                  ))}
                </select>
                {getAvailableWashers(selectedReservation).length === 0 && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    No hay lavadores disponibles en este momento
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowAssignModal(false)}
                  disabled={isAssigning}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  onClick={handleAssignWasher}
                  disabled={!selectedWasher || isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Asignar Lavador
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}
