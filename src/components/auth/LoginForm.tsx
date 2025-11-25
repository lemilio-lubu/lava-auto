"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { loginSchema } from '@/lib/validations/auth.schema';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Datos inválidos');
      return;
    }
    const res = await signIn('credentials', { redirect: false, email, password });
    // @ts-ignore
    if (res?.error) setError('Credenciales inválidas');
    else window.location.href = '/dashboard';
  }

  return (
    <form onSubmit={handleSubmit} className="w-[420px] p-8 bg-surface-muted rounded">
      <h2 className="text-xl font-semibold mb-4">Ingresar</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <label className="block mb-2">Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
      <label className="block mb-2">Contraseña</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
      <button className="w-full p-2 bg-primary rounded text-primary-contrast">Ingresar</button>
    </form>
  );
}
