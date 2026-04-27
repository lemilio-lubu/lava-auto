"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '@/lib/validations/auth.schema';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';
import { Settings, Mail, Lock, User, Phone, Loader2, CheckCircle2, CreditCard, MapPin, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ECUADOR_PROVINCES = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
  'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja',
  'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza',
  'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
  'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe',
];

const INPUT_CLASS =
  'w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-cyan-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed';

const SELECT_CLASS =
  'w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-cyan-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed appearance-none';

export function RegisterForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    identification: '',
    city: '',
    province: '',
    company: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { modalState, showError, closeModal } = useModal();
  const { register } = useAuth();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '') }));
  }

  function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, identification: e.target.value.replace(/[^0-9]/g, '') }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'Por favor, verifica todos los campos';
      setError(firstError);
      setIsLoading(false);
      return;
    }

    try {
      await register({ ...parsed.data, role: 'CLIENT' });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear la cuenta. El email podría estar en uso.';
      showError('Error al registrar', errorMessage);
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-6 animate-fadeIn">
        <div className="glass-effect dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-8 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-lg animate-bounce-slow">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Cuenta creada!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Tu cuenta ha sido creada exitosamente.</p>
          <p className="text-sm text-slate-500 dark:text-slate-500">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-lg mx-auto p-6 animate-fadeIn">
        <div className="glass-effect dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl mb-4 shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Crear cuenta</h1>
            <p className="text-slate-600 dark:text-slate-400">Únete a Body Shop</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border-2 border-red-400 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="font-medium">⚠</span>
                {error}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="Juan Pérez"
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Identificación */}
            <div>
              <label htmlFor="identification" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Cédula / RUC <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="identification"
                  name="identification"
                  type="text"
                  value={form.identification}
                  onChange={handleIdChange}
                  className={INPUT_CLASS}
                  placeholder="0912345678"
                  required
                  disabled={isLoading}
                  maxLength={13}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">Cédula (10 dígitos) o RUC (13 dígitos)</p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Celular <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  className={INPUT_CLASS}
                  placeholder="0991234567"
                  required
                  disabled={isLoading}
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">10 dígitos iniciando con 0 (Ej: 0991234567)</p>
            </div>

            {/* Provincia + Ciudad en grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Provincia <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                  <select
                    id="province"
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    className={SELECT_CLASS}
                    required
                    disabled={isLoading}
                  >
                    <option value="">Seleccionar</option>
                    {ECUADOR_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ciudad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                    placeholder="Guayaquil"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Empresa (opcional) */}
            <div>
              <label htmlFor="company" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Empresa <span className="text-slate-400 font-normal text-xs">(opcional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={form.company}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="Nombre de tu empresa"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">Mínimo 6 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cyan-100 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>¿Necesitas ayuda? Contacta a soporte técnico</p>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </>
  );
}
