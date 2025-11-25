import { NextResponse } from 'next/server';
import { generateResetToken, resetPassword } from '@/services/user.service';

export async function POST(request: Request) {
  const { email } = await request.json();
  const token = await generateResetToken(email);
  if (!token) return NextResponse.json({ error: 'No user' }, { status: 404 });

  // TODO: Implementar envío de email en producción
  // Opciones populares:
  // - Resend: https://resend.com
  // - SendGrid: https://sendgrid.com
  // - Nodemailer + Gmail SMTP
  // - AWS SES
  // 
  // Ejemplo con Resend:
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'noreply@tudominio.com',
  //   to: email,
  //   subject: 'Recuperación de contraseña - Autolavado Digital',
  //   html: `<p>Tu código de recuperación es: <strong>${token}</strong></p>
  //          <p>Este código expira en 1 hora.</p>`
  // });

  // DESARROLLO: Retornar token en respuesta (ELIMINAR EN PRODUCCIÓN)
  return NextResponse.json({ 
    token,
    message: 'Token generado. En producción esto se enviaría por email.' 
  });
}

export async function PUT(request: Request) {
  const { token, password } = await request.json();
  const ok = await resetPassword(token, password);
  if (!ok) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
