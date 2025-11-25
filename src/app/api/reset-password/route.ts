import { NextResponse } from 'next/server';
import { generateResetToken, resetPassword } from '@/services/user.service';

export async function POST(request: Request) {
  const { email } = await request.json();
  const token = await generateResetToken(email);
  if (!token) return NextResponse.json({ error: 'No user' }, { status: 404 });

  // NOTE: email sending should be implemented; for now return token in response for dev
  return NextResponse.json({ token });
}

export async function PUT(request: Request) {
  const { token, password } = await request.json();
  const ok = await resetPassword(token, password);
  if (!ok) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
