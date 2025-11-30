'use client';

import { useEffect, useState } from 'react';

interface Job {
  id: string;
  scheduledDate: string;
  scheduledTime: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  service: { name: string; price: number };
  user: { name: string; phone?: string };
  vehicle: { brand: string; model: string; plate: string };
}

export default function WasherDashboard() {
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Trabajos disponibles
      const resAvailable = await fetch('/api/jobs/available?status=PENDING');
      const available = await resAvailable.json();
      setAvailableJobs(available);

      // Mis trabajos asignados
      const resMine = await fetch('/api/jobs/available?status=CONFIRMED');
      const mine = await resMine.json();
      setMyJobs(mine);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
    }
  };

  const acceptJob = async (jobId: string) => {
    try {
      const res = await fetch('/api/jobs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reservationId: jobId,
          estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString(),
        }),
      });

      if (res.ok) {
        fetchJobs();
        alert('¡Trabajo aceptado! El cliente ha sido notificado.');
      }
    } catch (error) {
      console.error('Error al aceptar trabajo:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      const res = await fetch('/api/washers/toggle-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });

      if (res.ok) {
        setIsAvailable(!isAvailable);
      }
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🚿 Panel Washer</h2>
        <button
          onClick={toggleAvailability}
          className={`px-4 py-2 rounded ${
            isAvailable ? 'bg-green-600' : 'bg-gray-400'
          } text-white`}
        >
          {isAvailable ? '✅ Disponible' : '⏸️ No Disponible'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trabajos Disponibles */}
        <div>
          <h3 className="text-xl font-semibold mb-4">📍 Trabajos Disponibles ({availableJobs.length})</h3>
          <div className="space-y-3">
            {availableJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold">{job.service.name}</h4>
                    <p className="text-sm text-gray-600">{job.user.name}</p>
                  </div>
                  <span className="text-green-600 font-bold">${job.service.price}</span>
                </div>
                
                <p className="text-sm mb-2">
                  🚗 {job.vehicle.brand} {job.vehicle.model} ({job.vehicle.plate})
                </p>
                <p className="text-sm mb-2">
                  📅 {new Date(job.scheduledDate).toLocaleDateString()} a las {job.scheduledTime}
                </p>
                {job.address && (
                  <p className="text-sm mb-3">📍 {job.address}</p>
                )}
                
                <button
                  onClick={() => acceptJob(job.id)}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Aceptar Trabajo
                </button>
              </div>
            ))}
            {availableJobs.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay trabajos disponibles</p>
            )}
          </div>
        </div>

        {/* Mis Trabajos */}
        <div>
          <h3 className="text-xl font-semibold mb-4">📋 Mis Trabajos ({myJobs.length})</h3>
          <div className="space-y-3">
            {myJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold">{job.service.name}</h4>
                    <p className="text-sm text-gray-600">{job.user.name}</p>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    {job.status}
                  </span>
                </div>
                
                <p className="text-sm mb-2">
                  🚗 {job.vehicle.brand} {job.vehicle.model}
                </p>
                <p className="text-sm mb-3">
                  📅 {new Date(job.scheduledDate).toLocaleDateString()} a las {job.scheduledTime}
                </p>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-green-600 text-white py-2 rounded text-sm">
                    Iniciar Servicio
                  </button>
                  <button className="flex-1 bg-gray-600 text-white py-2 rounded text-sm">
                    Ver Mapa
                  </button>
                </div>
              </div>
            ))}
            {myJobs.length === 0 && (
              <p className="text-gray-500 text-center py-8">No tienes trabajos asignados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
