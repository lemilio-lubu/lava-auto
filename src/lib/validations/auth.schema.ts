import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});
