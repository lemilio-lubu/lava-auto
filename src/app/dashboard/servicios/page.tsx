'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import ConfirmModal from '@/components/ui/ConfirmModal';

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  vehicleType: string;
  isActive: boolean;
};

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    vehicleType: 'SEDAN',
  });
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    serviceId: '',
    serviceName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/services/${editingId}` : '/api/services';
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
          name: '',
          description: '',
          duration: '',
          price: '',
          vehicleType: 'SEDAN',
        });
        setToast({
          isOpen: true,
          title: '¡Éxito!',
          message: `Servicio ${editingId ? 'actualizado' : 'creado'} correctamente.`,
          type: 'success',
        });
        fetchServices();
      } else {
        const error = await res.json();
        setToast({
          isOpen: true,
          title: 'Error',
          message: error.error || 'Error al guardar servicio',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'Error al guardar servicio',
        type: 'error',
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
      vehicleType: service.vehicleType,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      serviceId: id,
      serviceName: name,
    });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const { serviceId: id } = confirmModal;

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setToast({
          isOpen: true,
          title: '¡Eliminado!',
          message: 'El servicio ha sido eliminado correctamente.',
          type: 'success',
        });
        fetchServices();
      } else {
        const error = await res.json();
        setToast({
          isOpen: true,
          title: 'Error',
          message: error.error || 'Error al eliminar servicio',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'Error al eliminar servicio',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, serviceId: '', serviceName: '' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      duration: '',
      price: '',
      vehicleType: 'SEDAN',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-200 dark:border-cyan-700 border-t-cyan-600 dark:border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Servicios</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestiona los servicios de lavado disponibles</p>
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
            <><Plus className="w-5 h-5" /> Nuevo Servicio</>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</CardTitle>
                <CardDescription>
                  {editingId ? 'Modifica los datos del servicio' : 'Completa la información del nuevo servicio'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Servicio</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                placeholder="Lavado completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all resize-none"
                placeholder="Descripción del servicio..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precio ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 outline-none transition-all"
                  placeholder="25.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Vehículo</label>
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

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
              >
                {editingId ? 'Actualizar Servicio' : 'Crear Servicio'}
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
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo Vehículo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duración</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {services.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No hay servicios registrados</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Crea tu primer servicio usando el botón superior</p>
                  </div>
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="hover:bg-cyan-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{service.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{service.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant="neutral" size="sm">{service.vehicleType}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{service.duration} min</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">${service.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(service.id, service.name)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
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
        onClose={() => setConfirmModal({ isOpen: false, serviceId: '', serviceName: '' })}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar servicio?"
        message={`¿Estás seguro de eliminar el servicio "${confirmModal.serviceName}"? Esta acción no se puede deshacer.`}
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
