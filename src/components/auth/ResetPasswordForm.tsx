"use client";

import { useState } from 'react';
import { resetPasswordSchema } from '@/lib/validations/auth.schema';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';
import { Droplets, Mail, Key, Lock, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

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
      <div className="w-full max-w-md mx-auto p-6 animate-fadeIn">
        <div className="glass-effect dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-8 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-lg animate-bounce-slow">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Contraseña restablecida!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Tu contraseña ha sido actualizada exitosamente.</p>
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
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {step === 'request' ? 'Recuperar contraseña' : 'Restablecer contraseña'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {step === 'request'
                ? 'Ingresa tu correo para recibir un token de recuperación'
                : 'Ingresa el token y tu nueva contraseña'}
            </p>
          </div>

        {error && (
          <div className="bg-red-500/10 border-2 border-red-400 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span className="font-medium">⚠</span>
            {error}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={requestReset} className="space-y-6">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-6">
            {generatedToken ? (
              <div className="bg-emerald-500/10 border-2 border-emerald-500 dark:border-emerald-400 rounded-lg p-4 space-y-2">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">🔐 Token generado (Modo Desarrollo)</p>
                <div className="bg-white dark:bg-slate-700 rounded p-3">
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm break-all">{generatedToken}</code>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  📧 En producción, este token se enviaría a: <strong>{email}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setToken(generatedToken);
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline"
                >
                  Copiar al campo de abajo
                </button>
              </div>
            ) : (
              <div className="bg-cyan-500/10 border-2 border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-400 px-4 py-3 rounded-lg text-sm">
                Revisa tu correo electrónico (<strong>{email}</strong>) para obtener el token de recuperación.
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Token de recuperación
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-slate-700 border-2 border-cyan-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed font-mono"
                  placeholder="ABC123XYZ"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Nueva contraseña
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
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                'Restablecer contraseña'
              )}
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
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
              >
                Solicitar nuevo token
              </button>
              <span className="text-slate-400 dark:text-slate-600 mx-2">•</span>
              <Link
                href="/login"
                className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}

        {step === 'request' && (
          <div className="mt-6 pt-6 border-t border-cyan-100 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        )}
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
