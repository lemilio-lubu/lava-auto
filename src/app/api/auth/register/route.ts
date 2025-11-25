import { NextResponse } from 'next/server';
import { createUser, findByEmail } from '@/services/user.service';
import { registerSchema } from '@/lib/validations/auth.schema';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await findByEmail(parsed.data.email);
  if (existing) return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 });

  const user = await createUser(parsed.data);
  return NextResponse.json({ id: user.id }, { status: 201 });
}
