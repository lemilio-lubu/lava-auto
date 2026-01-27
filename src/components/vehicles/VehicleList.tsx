'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Car as CarIcon } from 'lucide-react';
import Link from 'next/link';
import VehicleFormModal from './VehicleFormModal';
import DeleteVehicleModal from './DeleteVehicleModal';
import CannotDeleteModal from './CannotDeleteModal';
import { vehicleApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number | null;
  color: string | null;
  vehicleType: string;
  hasActiveReservations?: boolean;
}

interface VehicleListProps {
  vehicles: Vehicle[];
}

export default function VehicleList({ vehicles: initialVehicles }: VehicleListProps) {
  const router = useRouter();
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
      
      // Actualizar el estado local
      setVehicles(vehicles.filter(v => v.id !== vehicleToDelete.id));
      setVehicleToDelete(null);
    } catch (err: any) {
      // Si el error indica que hay reservas activas, mostrar modal especial
      if (err.data?.hasActiveReservations) {
        setVehicleToDelete(null);
        setCannotDeleteVehicle(vehicleToDelete);
        setShowCannotDeleteModal(true);
      } else {
        alert(err.message || 'Error al eliminar el vehículo');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setVehicleToDelete(null);
  };

  const handleCloseModal = async () => {
    setShowModal(false);
    setEditingVehicle(undefined);
    
    // Recargar vehículos después de crear/editar
    if (token) {
      try {
        const updatedVehicles = await vehicleApi.getAll(token);
        setVehicles(updatedVehicles);
      } catch (error) {
        console.error('Error reloading vehicles:', error);
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
            Agrega tu primer vehículo para poder solicitar servicios de lavado
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Registrar Primer Vehículo
          </button>
        </div>

        {showModal && (
          <VehicleFormModal
            onClose={handleCloseModal}
            onSuccess={handleCloseModal}
          />
        )}
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
          <div
            key={vehicle.id}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <CarIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Editar vehículo"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(vehicle)}
                  disabled={deletingId === vehicle.id}
                  className={`p-2 rounded-lg transition-colors ${
                    vehicle.hasActiveReservations
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  } disabled:opacity-50`}
                  title={
                    vehicle.hasActiveReservations
                      ? 'No se puede eliminar: tiene reservas activas'
                      : 'Eliminar vehículo'
                  }
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {vehicle.year}
            </p>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Placa</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {vehicle.plate}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Color</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {vehicle.color}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Tipo</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {vehicle.vehicleType}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Link
                href={`/dashboard/client/nueva-reserva?vehicleId=${vehicle.id}`}
                className="block w-full text-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Solicitar Lavado
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={handleCloseModal}
          onSuccess={handleCloseModal}
        />
      )}

      {vehicleToDelete && (
        <DeleteVehicleModal
          vehicleName={`${vehicleToDelete.brand} ${vehicleToDelete.model} (${vehicleToDelete.plate})`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
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
