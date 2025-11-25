import { z } from 'zod';

export const productoSchema = z.object({
  nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio debe ser mayor a 0'),
  stock: z.number().int().min(0, 'Stock no puede ser negativo'),
  categoria: z.string().min(1, 'Categoría requerida'),
  imagen: z.string().url().optional(),
});
