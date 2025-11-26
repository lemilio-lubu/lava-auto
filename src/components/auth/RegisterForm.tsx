"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '@/lib/validations/auth.schema';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';

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
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-surface-muted rounded-lg shadow-xl p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-2">¡Cuenta creada!</h2>
          <p className="text-on-surface-muted mb-4">Tu cuenta ha sido creada exitosamente.</p>
          <p className="text-sm text-on-surface-muted">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-surface-muted rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Crear cuenta</h1>
          <p className="text-on-surface-muted">Únete a Autolavado Digital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-2">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="Juan Pérez"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="tu@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-on-surface mb-2">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                // Solo permitir números
                const value = e.target.value.replace(/[^0-9]/g, '');
                setPhone(value);
              }}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="0991234567"
              required
              disabled={isLoading}
              maxLength={10}
            />
            <p className="text-xs text-on-surface-muted mt-1">Formato: 10 dígitos iniciando con 0 (Ej: 0991234567)</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={6}
            />
            <p className="text-xs text-on-surface-muted mt-1">Mínimo 6 caracteres</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-contrast font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-on-surface-muted">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-medium transition"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
}
