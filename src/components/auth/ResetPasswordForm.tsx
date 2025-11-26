"use client";

import { useState } from 'react';
import { resetPasswordSchema } from '@/lib/validations/auth.schema';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { modalState, showError, closeModal } = useModal();

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        showError('Error', 'No se pudo iniciar el proceso. Verifica tu correo electrónico.');
      } else {
        const data = await res.json();
        // Guardar el token para mostrarlo en modo desarrollo
        if (data.token) {
          setGeneratedToken(data.token);
        }
        setStep('reset');
      }
    } catch (err) {
      showError('Error', 'Ocurrió un error. Por favor, intenta más tarde.');
    } finally {
      setIsLoading(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setError('Por favor, verifica los datos ingresados');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/reset-password', {
        method: 'PUT',
        body: JSON.stringify(parsed.data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        showError('Error', 'Token inválido o expirado. Solicita un nuevo enlace.');
      } else {
        setStep('success');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor, intenta más tarde.');
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 'success') {
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
          <h2 className="text-2xl font-bold text-on-surface mb-2">¡Contraseña restablecida!</h2>
          <p className="text-on-surface-muted mb-4">Tu contraseña ha sido actualizada exitosamente.</p>
          <p className="text-sm text-on-surface-muted">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-surface-muted rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface mb-2">
            {step === 'request' ? 'Recuperar contraseña' : 'Restablecer contraseña'}
          </h1>
          <p className="text-on-surface-muted">
            {step === 'request'
              ? 'Ingresa tu correo para recibir un token de recuperación'
              : 'Ingresa el token y tu nueva contraseña'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={requestReset} className="space-y-6">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-contrast font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-primary hover:text-primary/80 transition"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-6">
            {generatedToken ? (
              <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 space-y-2">
                <p className="text-sm text-green-400 font-semibold">🔐 Token generado (Modo Desarrollo)</p>
                <div className="bg-surface rounded p-3">
                  <code className="text-green-400 font-mono text-sm break-all">{generatedToken}</code>
                </div>
                <p className="text-xs text-on-surface-muted">
                  📧 En producción, este token se enviaría a: <strong>{email}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setToken(generatedToken);
                  }}
                  className="text-xs text-green-400 hover:text-green-300 underline"
                >
                  Copiar al campo de abajo
                </button>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500 text-blue-400 px-4 py-3 rounded-lg text-sm">
                Revisa tu correo electrónico (<strong>{email}</strong>) para obtener el token de recuperación.
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-on-surface mb-2">
                Token de recuperación
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition font-mono"
                placeholder="ABC123XYZ"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-2">
                Nueva contraseña
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
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-contrast font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setError(null);
                  setToken('');
                  setPassword('');
                }}
                className="text-sm text-on-surface-muted hover:text-on-surface transition"
              >
                Solicitar nuevo token
              </button>
              <span className="text-on-surface-muted mx-2">•</span>
              <Link
                href="/login"
                className="text-sm text-primary hover:text-primary/80 transition"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}

        {step === 'request' && (
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
        )}
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
