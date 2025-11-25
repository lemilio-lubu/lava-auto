"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '@/lib/validations/auth.schema';

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ name, email, password, phone });
    if (!parsed.success) {
      setError('Datos inválidos');
      return;
    }

    const res = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify(parsed.data), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) {
      setError('No se pudo crear la cuenta');
      return;
    }

    // auto-login
    router.push('/login');
  }

  return (
    <form onSubmit={handleSubmit} className="w-[420px] p-8 bg-surface-muted rounded">
      <h2 className="text-xl font-semibold mb-4">Crear cuenta</h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <label className="block mb-2">Nombre</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
      <label className="block mb-2">Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
      <label className="block mb-2">Contraseña</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
      <label className="block mb-2">Teléfono</label>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 rounded mb-4 text-black" />
      <button className="w-full p-2 bg-primary rounded text-primary-contrast">Crear cuenta</button>
    </form>
  );
}
