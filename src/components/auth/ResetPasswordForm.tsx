"use client";

import { useState } from 'react';
import { resetPasswordSchema } from '@/lib/validations/auth.schema';
import { useRouter } from 'next/navigation';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/reset-password', { method: 'POST', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) setError('No se pudo iniciar el proceso');
    else setStep('reset');
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setError('Datos inválidos');
      return;
    }
    const res = await fetch('/api/reset-password', { method: 'PUT', body: JSON.stringify(parsed.data), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) setError('No se pudo resetear');
    else router.push('/auth/login');
  }

  return (
    <div className="w-[420px] p-8 bg-surface-muted rounded">
      <h2 className="text-xl font-semibold mb-4">Recuperar contraseña</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {step === 'request' ? (
        <form onSubmit={requestReset}>
          <label className="block mb-2">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
          <button className="w-full p-2 bg-primary rounded text-primary-contrast">Solicitar reset</button>
        </form>
      ) : (
        <form onSubmit={submitReset}>
          <label className="block mb-2">Token</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
          <label className="block mb-2">Nueva contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
          <button className="w-full p-2 bg-primary rounded text-primary-contrast">Restablecer</button>
        </form>
      )}
    </div>
  );
}
