'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck, ShieldOff } from 'lucide-react';
import { authApi } from '@/lib/api-client';
import Image from 'next/image';

export default function PerfilPage() {
  const { user, token, refreshUser } = useAuth();

  // ── Cambio de contraseña ─────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // ── 2FA ──────────────────────────────────────────────────────────
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [tfaError, setTfaError] = useState('');
  const [tfaSuccess, setTfaSuccess] = useState('');
  const [tfaLoading, setTfaLoading] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  if (!user) return null;

  const roleLabel = { ADMIN: 'Administrador', CLIENT: 'Cliente', EMPLOYEE: 'Técnico' }[user.role] ?? user.role;

  // ── Handlers contraseña ──────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (pwForm.newPassword.length < 6) { setPwError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Las contraseñas no coinciden.'); return; }

    setPwLoading(true);
    try {
      await authApi.changeSelfPassword(user.id, pwForm.currentPassword, pwForm.newPassword, token!);
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 5000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
    } finally {
      setPwLoading(false);
    }
  };

  // ── Handlers 2FA ─────────────────────────────────────────────────
  const handleSetup2FA = async () => {
    setTfaError('');
    setTfaSuccess('');
    setTfaLoading(true);
    try {
      const { qrDataUrl: qr } = await authApi.setup2FA(user.id, token!);
      setQrDataUrl(qr);
      setTotpCode('');
    } catch (err: unknown) {
      setTfaError(err instanceof Error ? err.message : 'Error al configurar 2FA.');
    } finally {
      setTfaLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTfaError('');
    setTfaLoading(true);
    try {
      await authApi.verify2FA(user.id, totpCode, token!);
      setTfaSuccess('2FA activado. Tu cuenta está ahora protegida con doble factor.');
      setQrDataUrl('');
      setTotpCode('');
      await refreshUser();
    } catch (err: unknown) {
      setTfaError(err instanceof Error ? err.message : 'Código incorrecto.');
    } finally {
      setTfaLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTfaError('');
    setTfaLoading(true);
    try {
      await authApi.disable2FA(user.id, disableCode, token!);
      setTfaSuccess('2FA desactivado.');
      setDisableCode('');
      setShowDisable(false);
      await refreshUser();
    } catch (err: unknown) {
      setTfaError(err instanceof Error ? err.message : 'Código incorrecto.');
    } finally {
      setTfaLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi Perfil</h1>
        <p className="text-slate-600 dark:text-slate-400">Información de tu cuenta</p>
      </div>

      {/* User Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
              {roleLabel}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Teléfono</span>
            <p className="font-medium text-slate-900 dark:text-white">{user.phone ?? 'No registrado'}</p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Rol</span>
            <p className="font-medium text-slate-900 dark:text-white">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Cambiar contraseña</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña actual</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar nueva contraseña</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" />
          </div>
          {pwError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{pwError}</p>}
          {pwSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4" /> Contraseña actualizada exitosamente.
            </div>
          )}
          <button type="submit" disabled={pwLoading} className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Actualizar contraseña
          </button>
        </form>
      </div>

      {/* 2FA */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Autenticación en dos pasos</h3>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.totpEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
            {user.totpEnabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Protege tu cuenta con un código temporal generado por una app autenticadora (Google Authenticator, Authy, etc.).
        </p>

        {tfaError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-4">{tfaError}</p>}
        {tfaSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 mb-4">
            <CheckCircle className="w-4 h-4" /> {tfaSuccess}
          </div>
        )}

        {!user.totpEnabled && (
          <>
            {!qrDataUrl ? (
              <button onClick={handleSetup2FA} disabled={tfaLoading} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
                {tfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Activar 2FA
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  1. Escanea este código QR con tu app autenticadora.<br />
                  2. Ingresa el código de 6 dígitos generado para confirmar.
                </p>
                <div className="flex justify-center">
                  <Image src={qrDataUrl} alt="QR 2FA" width={200} height={200} className="rounded-lg border border-slate-200 dark:border-slate-600" />
                </div>
                <form onSubmit={handleVerify2FA} className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-center text-xl tracking-widest"
                  />
                  <button type="submit" disabled={tfaLoading || totpCode.length < 6} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
                    {tfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {user.totpEnabled && (
          <>
            {!showDisable ? (
              <button onClick={() => { setShowDisable(true); setTfaError(''); }} className="flex items-center gap-2 px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-lg transition-colors">
                <ShieldOff className="w-4 h-4" />
                Desactivar 2FA
              </button>
            ) : (
              <form onSubmit={handleDisable2FA} className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Ingresa tu código 2FA actual para confirmar la desactivación.</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={disableCode}
                    onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    autoFocus
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono text-center text-xl tracking-widest"
                  />
                  <button type="submit" disabled={tfaLoading || disableCode.length < 6} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
                    {tfaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desactivar'}
                  </button>
                  <button type="button" onClick={() => setShowDisable(false)} className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
