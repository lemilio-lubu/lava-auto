'use client';

import { useState, useEffect } from 'react';
import { Car, Plus, X } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import ConfirmModal from '@/components/ui/ConfirmModal';

type Vehicle = {
  id: string;
  ownerName: string;
  ownerPhone: string | null;
  brand: string;
  model: string;
  plate: string;
  vehicleType: string;
  color: string | null;
};

export default function VehiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    brand: '',
    model: '',
    plate: '',
    vehicleType: 'SEDAN',
    color: '',
  });
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    vehicleId: '',
    vehicleInfo: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/vehicles/${editingId}` : '/api/vehicles';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          ownerName: '',
          ownerPhone: '',
          brand: '',
          model: '',
          plate: '',
          vehicleType: 'SEDAN',
          color: '',
        });
        setToast({
          isOpen: true,
          title: '¡Éxito!',
          message: `Vehículo ${editingId ? 'actualizado' : 'creado'} correctamente.`,
          type: 'success',
        });
        fetchVehicles();
      } else {
        const error = await res.json();
        setToast({
          isOpen: true,
          title: 'Error',
          message: error.error || 'Error al guardar vehículo',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar vehículo',
        type: 'error',
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      ownerName: vehicle.ownerName,
      ownerPhone: vehicle.ownerPhone || '',
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      vehicleType: vehicle.vehicleType,
      color: vehicle.color || '',
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id: string, vehicleInfo: string) => {
    setConfirmModal({
      isOpen: true,
      vehicleId: id,
      vehicleInfo,
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const { vehicleId: id } = confirmModal;

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setToast({
          isOpen: true,
          title: '¡Eliminado!',
          message: 'El vehículo ha sido eliminado correctamente.',
          type: 'success',
        });
        fetchVehicles();
      } else {
        const error = await res.json();
        setToast({
          isOpen: true,
          title: 'Error',
          message: error.error || 'Error al eliminar vehículo',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'Error al eliminar vehículo',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, vehicleId: '', vehicleInfo: '' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      ownerName: '',
      ownerPhone: '',
      brand: '',
      model: '',
      plate: '',
      vehicleType: 'SEDAN',
      color: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-200 dark:border-slate-600 border-t-cyan-600 dark:border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando vehículos...</p>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Vehículos</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona los vehículos registrados en el sistema</p>
        </div>
        <Button
          onClick={() => {
            if (showForm && !editingId) {
              handleCancel();
            } else {
              setShowForm(!showForm);
            }
          }}
          size="lg"
        >
          {showForm && !editingId ? (
            <><X className="w-5 h-5" /> Cancelar</>
          ) : (
            <><Plus className="w-5 h-5" /> Nuevo Vehículo</>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Car className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle>{editingId ? 'Editar Vehículo' : 'Nuevo Vehículo'}</CardTitle>
                <CardDescription>
                  {editingId ? 'Modifica los datos del vehículo' : 'Completa la información del nuevo vehículo'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Dueño</label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                  placeholder="555-1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Marca</label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                  placeholder="Toyota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                  placeholder="Corolla"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Placa</label>
                <input
                  type="text"
                  required
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                  placeholder="ABC123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                >
                  <option value="SEDAN">Sedán</option>
                  <option value="SUV">SUV</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="VAN">Van</option>
                  <option value="MOTORCYCLE">Motocicleta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color (opcional)</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                placeholder="Blanco"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
              >
                {editingId ? 'Actualizar Vehículo' : 'Crear Vehículo'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Placa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Marca/Modelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dueño</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No hay vehículos registrados</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Registra tu primer vehículo usando el botón superior</p>
                  </div>
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-cyan-50/50 dark:hover:bg-slate-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{vehicle.plate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{vehicle.brand} {vehicle.model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant="neutral" size="sm">{vehicle.vehicleType}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{vehicle.color || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{vehicle.ownerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{vehicle.ownerPhone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(vehicle.id, `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors"
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
      </Card>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, vehicleId: '', vehicleInfo: '' })}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar vehículo?"
        message={`¿Estás seguro de eliminar el vehículo ${confirmModal.vehicleInfo}? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />

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
