'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Sparkles, Calendar as CalendarIcon, Clock, FileText, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Calendar from '@/components/ui/Calendar';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Toast from '@/components/ui/Toast';

type Vehicle = {
  id: string;
  ownerName: string;
  brand: string;
  model: string;
  plate: string;
  vehicleType: string;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  vehicleType: string;
  description?: string;
};

export default function NuevaReservaPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceId: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, servicesRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/services'),
      ]);

      const vehiclesData = await vehiclesRes.json();
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);

      const servicesData = await servicesRes.json();
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setToast({
        isOpen: true,
        title: 'Error al cargar',
        message: 'No se pudieron cargar los datos. Intenta recargar la página.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    setFormData({ ...formData, vehicleId, serviceId: '' });
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      const vehicleServices = services.filter((s) => s.vehicleType === vehicle.vehicleType);
      setFilteredServices(vehicleServices);
      
      if (vehicleServices.length === 0) {
        setToast({
          isOpen: true,
          title: 'Sin servicios disponibles',
          message: 'No hay servicios disponibles para este tipo de vehículo',
          type: 'warning',
        });
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      scheduledDate: date.toISOString().split('T')[0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nielsen: Prevención de errores
    if (!formData.vehicleId || !formData.serviceId || !formData.scheduledDate || !formData.scheduledTime) {
      setToast({
        isOpen: true,
        title: 'Campos incompletos',
        message: 'Por favor completa todos los campos requeridos',
        type: 'warning',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setToast({
          isOpen: true,
          title: '¡Reserva creada!',
          message: 'Tu reserva ha sido creada exitosamente',
          type: 'success',
        });
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        const error = await res.json();
        setToast({
          isOpen: true,
          title: 'Error al crear reserva',
          message: error.error || 'Ocurrió un error. Intenta de nuevo.',
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
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);
  const selectedService = services.find((s) => s.id === formData.serviceId);

  // Nielsen: Visibilidad del estado - Indicador de progreso
  const completedSteps = [
    formData.vehicleId,
    formData.serviceId,
    formData.scheduledDate,
    formData.scheduledTime,
  ].filter(Boolean).length;
  const totalSteps = 4;

  return (
    <section className="max-w-6xl mx-auto">
      {/* Header con breadcrumb */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Reservas
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nueva Reserva</h1>
            <p className="text-slate-600 mt-1">
              Completa los datos para agendar tu servicio de autolavado
            </p>
          </div>
          
          {/* Nielsen: Visibilidad del estado - Progreso */}
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">
              Progreso: {completedSteps}/{totalSteps}
            </p>
            <div className="w-32 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Columna izquierda - Formulario */}
          <div className="space-y-6">
            {/* Paso 1: Seleccionar Vehículo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Car className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>1. Selecciona tu Vehículo</CardTitle>
                    <CardDescription>Elige el vehículo a lavar</CardDescription>
                  </div>
                  {formData.vehicleId && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-cyan-200 rounded-lg text-slate-900 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
                >
                  <option value="">Seleccionar vehículo...</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.plate} ({vehicle.ownerName})
                    </option>
                  ))}
                </select>
                
                {selectedVehicle && (
                  <div className="mt-4 p-3 bg-cyan-50 rounded-lg">
                    <p className="text-sm font-medium text-cyan-900">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="primary" size="sm">{selectedVehicle.plate}</Badge>
                      <Badge variant="neutral" size="sm">{selectedVehicle.vehicleType}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paso 2: Seleccionar Servicio */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>2. Elige el Servicio</CardTitle>
                    <CardDescription>Selecciona el tipo de lavado</CardDescription>
                  </div>
                  {formData.serviceId && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!formData.vehicleId ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>Primero selecciona un vehículo</span>
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-amber-600">
                      No hay servicios disponibles para este tipo de vehículo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredServices.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, serviceId: service.id })}
                        className={`
                          w-full text-left p-4 rounded-lg border-2 transition-all
                          ${formData.serviceId === service.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-emerald-300 bg-white'
                          }
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-slate-900">{service.name}</p>
                          <p className="text-xl font-bold text-emerald-600">
                            ${service.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          Duración: {service.duration} minutos
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paso 3: Hora */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle>3. Selecciona la Hora</CardTitle>
                    <CardDescription>Horario de atención: 8:00 AM - 6:00 PM</CardDescription>
                  </div>
                  {formData.scheduledTime && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  min="08:00"
                  max="18:00"
                  className="w-full px-4 py-3 border-2 border-cyan-200 rounded-lg text-slate-900 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all"
                />
              </CardContent>
            </Card>

            {/* Notas Adicionales */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle>Notas Adicionales (Opcional)</CardTitle>
                    <CardDescription>Información extra que debamos saber</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-cyan-200 rounded-lg text-slate-900 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all resize-none"
                  placeholder="Ejemplo: El auto tiene detalles especiales, manchas difíciles, etc."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Calendario y Resumen */}
          <div className="space-y-6">
            {/* Calendario */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">4. Selecciona la Fecha</h3>
                  <p className="text-sm text-slate-600">Elige el día de tu servicio</p>
                </div>
                {formData.scheduledDate && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 ml-auto" />
                )}
              </div>
              
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                minDate={new Date()}
                className="w-full"
              />
            </div>

            {/* Resumen de la Reserva */}
            {(selectedVehicle || selectedService || formData.scheduledDate || formData.scheduledTime) && (
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumen de tu Reserva</CardTitle>
                  <CardDescription>Verifica los datos antes de confirmar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedVehicle && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Vehículo</p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedVehicle.brand} {selectedVehicle.model}
                        </p>
                        <p className="text-sm text-slate-600">{selectedVehicle.plate}</p>
                      </div>
                    )}
                    
                    {selectedService && (
                      <div className="pt-4 border-t border-cyan-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Servicio</p>
                        <p className="text-sm font-medium text-slate-900">{selectedService.name}</p>
                        <p className="text-sm text-slate-600">{selectedService.duration} minutos</p>
                      </div>
                    )}
                    
                    {formData.scheduledDate && (
                      <div className="pt-4 border-t border-cyan-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Fecha y Hora</p>
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(formData.scheduledDate).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        {formData.scheduledTime && (
                          <p className="text-sm text-slate-600">{formData.scheduledTime}</p>
                        )}
                      </div>
                    )}
                    
                    {selectedService && (
                      <div className="pt-4 border-t border-cyan-100">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-slate-700">Total a Pagar</p>
                          <p className="text-2xl font-bold text-cyan-600">
                            ${selectedService.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full space-y-2">
                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      isLoading={isSubmitting}
                      disabled={completedSteps < totalSteps}
                    >
                      Confirmar Reserva
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={() => router.push('/dashboard')}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </form>

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
