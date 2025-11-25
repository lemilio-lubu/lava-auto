"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { loginSchema } from '@/lib/validations/auth.schema';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Por favor, verifica los datos ingresados');
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn('credentials', { redirect: false, email, password });
      // @ts-ignore
      if (res?.error) {
        setError('Credenciales inválidas. Por favor, intenta de nuevo.');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor, intenta más tarde.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-surface-muted rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Bienvenido</h1>
          <p className="text-on-surface-muted">Ingresa a tu cuenta de Autolavado Digital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

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
            />
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/reset-password"
              className="text-sm text-primary hover:text-primary/80 transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-contrast font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-on-surface-muted">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 font-medium transition"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
