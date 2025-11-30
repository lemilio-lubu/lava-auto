'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Mail, Lock, Phone, MapPin, Shield, Wrench } from 'lucide-react';

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'WASHER' as 'WASHER' | 'ADMIN',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario');
      }

      router.push('/dashboard/admin/usuarios');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/usuarios"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Usuario</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Crear nuevo lavador o administrador
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Información Básica
          </h2>

          <div className="space-y-4">
            {/* Rol */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Rol *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === 'WASHER'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="WASHER"
                    checked={formData.role === 'WASHER'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Wrench className={`w-6 h-6 ${formData.role === 'WASHER' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-semibold ${formData.role === 'WASHER' ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      Lavador
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Presta servicios de lavado
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === 'ADMIN'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ADMIN"
                    checked={formData.role === 'ADMIN'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Shield className={`w-6 h-6 ${formData.role === 'ADMIN' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <div>
                    <p className={`font-semibold ${formData.role === 'ADMIN' ? 'text-purple-900 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      Administrador
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Gestiona el sistema
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nombre Completo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Juan Pérez"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="usuario@ejemplo.com"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+52 55 1234 5678"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Nota sobre ubicación para Lavadores */}
        {formData.role === 'WASHER' && (
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-cyan-900 dark:text-cyan-300 mb-2">
                  📍 Ubicación Automática
                </h3>
                <p className="text-sm text-cyan-800 dark:text-cyan-200">
                  La ubicación del lavador se obtendrá automáticamente al iniciar sesión mediante la geolocalización del navegador.
                  El sistema solicitará permisos de ubicación y asignará trabajos cercanos en tiempo real.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4">
          <Link
            href="/dashboard/admin/usuarios"
            className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}
