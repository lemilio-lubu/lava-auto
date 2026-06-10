'use client';

import { useState } from 'react';
import { Plus, Car as CarIcon } from 'lucide-react';
import VehicleCard, { type Vehicle } from './VehicleCard';
import VehicleFormModal from './VehicleFormModal';
import DeleteVehicleModal from './DeleteVehicleModal';
import CannotDeleteModal from './CannotDeleteModal';
import { vehicleApi, ApiError } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleListProps {
  vehicles: Vehicle[];
}

export default function VehicleList({ vehicles: initialVehicles }: VehicleListProps) {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [cannotDeleteVehicle, setCannotDeleteVehicle] = useState<Vehicle | null>(null);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingVehicle(undefined);
    setShowModal(true);
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    if (vehicle.hasActiveReservations) {
      setCannotDeleteVehicle(vehicle);
      setShowCannotDeleteModal(true);
    } else {
      setVehicleToDelete(vehicle);
    }
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete || !token) return;

    setDeletingId(vehicleToDelete.id);

    try {
      await vehicleApi.delete(vehicleToDelete.id, token);
      setVehicles(vehicles.filter(v => v.id !== vehicleToDelete.id));
      setVehicleToDelete(null);
    } catch (err: unknown) {
      const errorData = err instanceof ApiError ? (err.data as { hasActiveReservations?: boolean } | undefined) : undefined;
      if (errorData?.hasActiveReservations) {
        setVehicleToDelete(null);
        setCannotDeleteVehicle(vehicleToDelete);
        setShowCannotDeleteModal(true);
      } else {
        alert(err instanceof Error ? err.message : 'Error al eliminar el vehículo');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = async () => {
    setShowModal(false);
    setEditingVehicle(undefined);

    if (token) {
      try {
        const updated = await vehicleApi.getAll(token);
        setVehicles(updated.map(v => ({ ...v, year: v.year ?? null, color: v.color ?? null })));
      } catch (error) {
        logger.error('Error recargando vehículos', error);
      }
    }
  };

  if (vehicles.length === 0) {
    return (
      <>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-12 text-center border border-slate-200 dark:border-slate-700">
          <CarIcon className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No tienes vehículos registrados
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Agrega tu primer vehículo para poder solicitar servicios
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Registrar Primer Vehículo
          </button>
        </div>
        {showModal && <VehicleFormModal onClose={handleCloseModal} onSuccess={handleCloseModal} />}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Agregar Vehículo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            deletingId={deletingId}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {showModal && (
        <VehicleFormModal
          vehicle={editingVehicle ? { ...editingVehicle, year: editingVehicle.year ?? null, color: editingVehicle.color ?? null } : undefined}
          onClose={handleCloseModal}
          onSuccess={handleCloseModal}
        />
      )}

      {vehicleToDelete && (
        <DeleteVehicleModal
          vehicleName={`${vehicleToDelete.brand} ${vehicleToDelete.model} (${vehicleToDelete.plate})`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setVehicleToDelete(null)}
          isDeleting={deletingId === vehicleToDelete.id}
        />
      )}

      {showCannotDeleteModal && cannotDeleteVehicle && (
        <CannotDeleteModal
          vehicleName={`${cannotDeleteVehicle.brand} ${cannotDeleteVehicle.model} (${cannotDeleteVehicle.plate})`}
          onClose={() => {
            setShowCannotDeleteModal(false);
            setCannotDeleteVehicle(null);
          }}
        />
      )}
    </>
  );
}
