import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  phone: z.string()
    .min(10, 'Teléfono debe tener al menos 10 dígitos')
    .regex(/^[0-9]+$/, 'Teléfono debe contener solo números')
    .regex(/^0[2-9][0-9]{8}$/, 'Formato inválido. Ej: 0991234567'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});
