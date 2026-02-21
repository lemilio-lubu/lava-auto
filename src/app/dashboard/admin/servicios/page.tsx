'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Edit, Trash, X } from 'lucide-react';
import { serviceApi } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Toast from '@/components/ui/Toast';

type Service = {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  vehicleType: string;
  isActive: boolean;
};

type ServiceFormData = {
  name: string;
  description: string;
  duration: string;
  price: string;
  vehicleType: string;
  isActive: boolean;
};

const VEHICLE_TYPES = ['SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'VAN', 'MOTORCYCLE'];

export default function ServiciosAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    duration: '',
    price: '',
    vehicleType: 'SEDAN',
    isActive: true,
  });
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

    loadServices();
  }, [user, token, authLoading, router]);

  const loadServices = async () => {
    if (!token) return;
    try {
      const data = await serviceApi.getAll(token);
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      duration: '',
      price: '',
      vehicleType: 'SEDAN',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
      vehicleType: service.vehicleType,
      isActive: service.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        vehicleType: formData.vehicleType,
        isActive: formData.isActive,
      };

      if (editingService) {
        await serviceApi.update(editingService.id, data, token);
        setToast({
          isOpen: true,
          title: 'Éxito',
          message: 'Servicio actualizado correctamente',
          type: 'success',
        });
      } else {
        await serviceApi.create(data, token);
        setToast({
          isOpen: true,
          title: 'Éxito',
          message: 'Servicio creado correctamente',
          type: 'success',
        });
      }

      setShowModal(false);
      loadServices();
    } catch (error: any) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Error al guardar el servicio',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`¿Estás seguro de eliminar el servicio "${name}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      await serviceApi.delete(id, token);
      setToast({
        isOpen: true,
        title: 'Éxito',
        message: 'Servicio eliminado correctamente',
        type: 'success',
      });
      loadServices();
    } catch (error: any) {
      // 409 means the service has associated reservations
      const isConflict = error?.status === 409;
      setToast({
        isOpen: true,
        title: isConflict ? 'No se puede eliminar' : 'Error',
        message: isConflict
          ? `El servicio "${name}" tiene reservas asociadas. Desactívalo en lugar de eliminarlo.`
          : (error.message || 'Error al eliminar el servicio'),
        type: 'error',
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Servicios</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Administra los servicios disponibles
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                    {service.vehicleType}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    service.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                  {service.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {service.description || 'Sin descripción'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 mb-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Precio</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${service.price}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Duración</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {service.duration} min
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleOpenEdit(service)}
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(service.id, service.name)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No hay servicios registrados
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-5 h-5" />
            Crear Primer Servicio
          </Button>
        </div>
      )}

      {/* Modal de Crear/Editar */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Ej: Lavado Premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                rows={3}
                placeholder="Descripción del servicio"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Duración (minutos) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Precio ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="100.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Vehículo *
              </label>
              <select
                required
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Servicio activo
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowModal(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" fullWidth disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  editingService ? 'Actualizar' : 'Crear'
                )}
              </Button>
            </div>
          </form>
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
