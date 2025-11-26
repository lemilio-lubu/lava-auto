"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '@/lib/validations/auth.schema';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';
import { Droplets, Mail, Lock, User, Phone, Loader2, CheckCircle2 } from 'lucide-react';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { modalState, showError, closeModal } = useModal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const parsed = registerSchema.safeParse({ name, email, password, phone });
    if (!parsed.success) {
      setError('Por favor, verifica que todos los campos estén correctos');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError('Error al registrar', data.error || 'No se pudo crear la cuenta. El email podría estar en uso.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      showError('Error', 'Ocurrió un error. Por favor, intenta más tarde.');
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
      <div className="w-full max-w-md mx-auto p-6 animate-fadeIn">
        <div className="glass-effect dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Crear cuenta</h1>
            <p className="text-slate-600 dark:text-slate-400">Únete a Autolavado Digital</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border-2 border-red-400 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="font-medium">⚠</span>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-cyan-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                placeholder="Juan Pérez"
                required
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-cyan-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                placeholder="tu@email.com"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  // Solo permitir números
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setPhone(value);
                }}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-cyan-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                placeholder="0991234567"
                required
                disabled={isLoading}
                maxLength={10}
                autoComplete="tel"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">Formato: 10 dígitos iniciando con 0 (Ej: 0991234567)</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-cyan-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
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
