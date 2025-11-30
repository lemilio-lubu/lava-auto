import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Car as CarIcon, User, Phone, DollarSign, Clock, Package } from 'lucide-react';
import JobActions from '@/components/washer/JobActions';

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONFIRMED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'WASHER') {
    redirect('/dashboard');
  }

  const job = await prisma.reservation.findUnique({
    where: { id },
    include: {
      service: true,
      vehicle: true,
      user: {
        select: {
          name: true,
          phone: true,
          email: true,
        },
      },
      washer: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!job || job.washerId !== user.id) {
    redirect('/dashboard/washer/trabajos');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/washer/trabajos"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Detalles del Trabajo</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Información completa de la reserva
          </p>
        </div>
      </div>

      {/* Estado del trabajo */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Estado</h2>
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              statusColors[job.status as keyof typeof statusColors]
            }`}
          >
            {statusLabels[job.status as keyof typeof statusLabels]}
          </span>
        </div>
        <JobActions jobId={job.id} status={job.status} />
      </div>

      {/* Información del servicio */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Servicio
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Tipo de servicio</span>
            <span className="font-semibold text-slate-900 dark:text-white">{job.service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Descripción</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right max-w-md">
              {job.service.description}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Precio base</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ${job.service.price.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
            <span className="text-slate-900 dark:text-white font-bold">Total a cobrar</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xl">
              ${job.totalAmount.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Información del vehículo */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CarIcon className="w-6 h-6" />
          Vehículo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Marca y modelo</span>
            <p className="font-semibold text-slate-900 dark:text-white">
              {job.vehicle.brand} {job.vehicle.model}
            </p>
          </div>
          <div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Placa</span>
            <p className="font-semibold text-slate-900 dark:text-white">{job.vehicle.plate}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Año</span>
            <p className="font-semibold text-slate-900 dark:text-white">{job.vehicle.year || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Color</span>
            <p className="font-semibold text-slate-900 dark:text-white">{job.vehicle.color || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Tipo</span>
            <p className="font-semibold text-slate-900 dark:text-white">{job.vehicle.vehicleType}</p>
          </div>
        </div>
      </div>

      {/* Información del cliente */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-6 h-6" />
          Cliente
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Nombre</span>
              <p className="font-semibold text-slate-900 dark:text-white">{job.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Teléfono</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                <a href={`tel:${job.user.phone}`} className="text-cyan-600 hover:underline">
                  {job.user.phone || 'No registrado'}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación y horario */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Ubicación y Horario
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-slate-400 mt-1" />
            <div className="flex-1">
              <span className="text-sm text-slate-600 dark:text-slate-400">Dirección</span>
              <p className="font-semibold text-slate-900 dark:text-white">{job.address}</p>
              {job.latitude && job.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${job.latitude},${job.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-600 hover:underline mt-1 inline-block"
                >
                  Ver en Google Maps →
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Fecha programada</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {new Date(job.scheduledDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Hora programada</span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {new Date(job.scheduledDate).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notas adicionales si existen */}
      {job.notes && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2">Notas del cliente</h3>
          <p className="text-amber-800 dark:text-amber-300">{job.notes}</p>
        </div>
      )}
    </div>
  );
}
