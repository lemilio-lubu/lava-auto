import { NextResponse } from 'next/server';
import * as productoService from '@/services/producto.service';
import { productoSchema } from '@/lib/validations/producto.schema';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || undefined;
  const categoria = url.searchParams.get('categoria') || undefined;
  const data = await productoService.findAll({ q, categoria });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = productoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const created = await productoService.create(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
