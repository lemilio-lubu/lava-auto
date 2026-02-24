"use client";

import { useState } from 'react';
import { loginSchema } from '@/lib/validations/auth.schema';
import Link from 'next/link';
import { Settings, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const { login } = useAuth();

  // Nielsen: Prevención de errores - Validación en tiempo real
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const validateEmail = (value: string) => {
    if (!value) return 'El correo es requerido';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Correo electrónico inválido';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'La contraseña es requerida';
    if (value.length < 6) return 'Mínimo 6 caracteres';
    return '';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    // Nielsen: Reconocer, diagnosticar y corregir errores
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      setIsLoading(false);
      return;
    }

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setToast({
        isOpen: true,
        title: 'Datos incorrectos',
        message: 'Por favor, verifica los datos ingresados',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      
      // Nielsen: Visibilidad del estado del sistema
      setToast({
        isOpen: true,
        title: '¡Bienvenido!',
        message: 'Accediendo al sistema...',
        type: 'success',
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      // Nielsen: Ayudar a reconocer y corregir errores
      const errorMessage = err instanceof Error ? err.message : 'Credenciales inválidas';
      setToast({
        isOpen: true,
        title: 'Error de autenticación',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto p-6 animate-fadeIn">
        <div className="glass-effect dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-slate-900/50 p-8">
          {/* Nielsen: Diseño estético y minimalista - Logo + Identidad visual */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl mb-4 shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Bienvenido
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Sistema de Gestión Automotriz
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email - Nielsen: Reconocer antes que recordar */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  onBlur={() => setFieldErrors({ ...fieldErrors, email: validateEmail(email) })}
                  className={`
                    w-full pl-11 pr-4 py-3 rounded-lg 
                    bg-white dark:bg-slate-700 border-2 
                    ${fieldErrors.email ? 'border-red-400 focus:border-red-500' : 'border-cyan-200 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400'}
                    text-slate-900 dark:text-white 
                    focus:outline-none focus:ring-2 
                    ${fieldErrors.email ? 'focus:ring-red-200' : 'focus:ring-cyan-200 dark:focus:ring-cyan-800'}
                    transition-all
                    disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
                  `}
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {/* Nielsen: Ayudar a reconocer y diagnosticar errores */}
              {fieldErrors.email && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="font-medium">⚠</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors({ ...fieldErrors, password: '' });
                  }}
                  onBlur={() => setFieldErrors({ ...fieldErrors, password: validatePassword(password) })}
                  className={`
                    w-full pl-11 pr-12 py-3 rounded-lg 
                    bg-white dark:bg-slate-700 border-2
                    ${fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-cyan-200 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400'}
                    text-slate-900 dark:text-white 
                    focus:outline-none focus:ring-2 
                    ${fieldErrors.password ? 'focus:ring-red-200' : 'focus:ring-cyan-200 dark:focus:ring-cyan-800'}
                    transition-all
                    disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
                  `}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                {/* Nielsen: Control y libertad del usuario */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <span className="font-medium">⚠</span> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Nielsen: Flexibilidad - Recuperación de contraseña */}
            <div className="flex items-center justify-end">
              <Link
                href="/reset-password"
                className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors underline decoration-dotted underline-offset-4"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón Submit - Nielsen: Visibilidad del estado */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3.5 px-4 
                bg-gradient-to-r from-cyan-600 to-cyan-700
                hover:from-cyan-700 hover:to-cyan-800
                text-white font-semibold rounded-lg 
                shadow-md hover:shadow-lg
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Nielsen: Relación con el mundo real - Lenguaje familiar */}
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
        </div>

        {/* Nielsen: Ayuda contextual */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>¿Necesitas ayuda? Contacta a soporte técnico</p>
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
