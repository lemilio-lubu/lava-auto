"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Toast from '@/components/ui/Toast';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const [emailError, setEmailError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) return 'El correo es requerido';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Correo electrónico inválido';
    return '';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      setIsLoading(false);
      return;
    }

    try {
      // Simular envío de correo de recuperación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
      setToast({
        isOpen: true,
        title: '¡Correo enviado!',
        message: 'Revisa tu bandeja de entrada',
        type: 'success',
      });
    } catch (err) {
      setToast({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo enviar el correo. Intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <>
        <div className="w-full max-w-md mx-auto p-6 animate-fadeIn">
          <div className="glass-effect dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Correo enviado!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>

        <Toast
          isOpen={toast.isOpen}
          onClose={() => setToast({ ...toast, isOpen: false })}
          title={toast.title}
          message={toast.message}
          type={toast.type}
        />
      </>
    );
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto p-6 animate-fadeIn">
        <div className="glass-effect dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl mb-4 shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Recuperar contraseña
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                  className={`block w-full pl-10 pr-4 py-3 rounded-xl border ${
                    emailError 
                      ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-slate-200 dark:border-slate-600 focus:ring-cyan-500 focus:border-cyan-500'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center gap-2"
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
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
}
