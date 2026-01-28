'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, User, CheckCircle, XCircle, X, Phone, Mail, MapPin } from 'lucide-react';
import { washerApi, Washer } from '@/lib/api-client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

export default function LavadoresAdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [washers, setWashers] = useState<Washer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
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

    loadWashers();
  }, [user, token, authLoading, router]);

  const loadWashers = async () => {
    if (!token) return;
    try {
      const data = await washerApi.getAll(token);
      setWashers(data);
    } catch (error) {
      console.error('Error loading washers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    try {
      await washerApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        address: formData.address || undefined
      }, token);

      setToast({
        isOpen: true,
        title: 'Éxito',
        message: 'Lavador registrado correctamente',
        type: 'success',
      });
      setShowModal(false);
      loadWashers();
    } catch (error: any) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: error.message || 'Error al registrar lavador',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Lavadores</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Administra los lavadores del sistema
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="w-5 h-5" />
          Registrar Lavador
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Lavadores</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{washers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Disponibles</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {washers.filter(w => w.isAvailable).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Washers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {washers.map((washer) => (
          <div
            key={washer.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {washer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{washer.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{washer.email}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                washer.isAvailable 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {washer.isAvailable ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Disponible
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Ocupado
                  </>
                )}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {washer.phone && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-4 h-4" />
                  {washer.phone}
                </div>
              )}
              {washer.address && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{washer.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="text-slate-600 dark:text-slate-400">
                  {washer.completedServices} servicios completados
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {washers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No hay lavadores registrados
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Registra tu primer lavador para comenzar
          </p>
          <Button onClick={handleOpenModal}>
            <Plus className="w-5 h-5" />
            Registrar Lavador
          </Button>
        </div>
      )}

      {/* Modal de Registro */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Registrar Nuevo Lavador
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="lavador@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="0999999999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Calle, Ciudad, Estado"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Registrar Lavador
                  </>
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
