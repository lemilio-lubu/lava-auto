import prisma from '@/lib/prisma';

export async function create(data: any) {
  return prisma.producto.create({ data });
}

export async function findAll(filters: { q?: string; categoria?: string } = {}) {
  const where: any = { activo: true };
  if (filters.q) {
    where.OR = [
      { nombre: { contains: filters.q, mode: 'insensitive' } },
      { descripcion: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.categoria) where.categoria = filters.categoria;
  return prisma.producto.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function findById(id: string) {
  return prisma.producto.findUnique({ where: { id } });
}

export async function update(id: string, data: any) {
  return prisma.producto.update({ where: { id }, data });
}

export async function remove(id: string) {
  // soft delete
  return prisma.producto.update({ where: { id }, data: { activo: false } });
}

export async function getCategories() {
  const cats = await prisma.producto.findMany({ select: { categoria: true } });
  const unique = Array.from(new Set(cats.map((c) => c.categoria)));
  return unique;
}
