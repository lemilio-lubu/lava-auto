import { NextResponse } from 'next/server';
import * as productoService from '@/services/producto.service';
import { productoSchema } from '@/lib/validations/producto.schema';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const prod = await productoService.findById(params.id);
  if (!prod) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prod);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = productoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await productoService.update(params.id, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const deleted = await productoService.remove(params.id);
  return NextResponse.json({ success: true });
}
