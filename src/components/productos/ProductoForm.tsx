"use client";

import { useState } from 'react';
import { productoSchema } from '@/lib/validations/producto.schema';
import { useRouter } from 'next/navigation';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';

export default function ProductoForm({ initial }: { initial?: any } = {}) {
  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion || '');
  const [precio, setPrecio] = useState(initial?.precio || 0);
  const [stock, setStock] = useState(initial?.stock || 0);
  const [categoria, setCategoria] = useState(initial?.categoria || '');
  const [imagen, setImagen] = useState(initial?.imagen || '');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { modalState, showSuccess, showError, closeModal } = useModal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = productoSchema.safeParse({ nombre, descripcion, precio: Number(precio), stock: Number(stock), categoria, imagen });
    if (!parsed.success) {
      showError('Datos inválidos', 'Por favor verifica que todos los campos estén correctos.');
      return;
    }

    const method = initial?.id ? 'PUT' : 'POST';
    const url = initial?.id ? `/api/productos/${initial.id}` : '/api/productos';
    const res = await fetch(url, { method, body: JSON.stringify(parsed.data), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) {
      showError('Error', 'No se pudo guardar el producto. Intenta de nuevo.');
      return;
    }
    showSuccess('¡Éxito!', `Producto ${initial?.id ? 'actualizado' : 'creado'} correctamente.`);
    setTimeout(() => router.push('/dashboard/productos'), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl p-4 bg-white text-black rounded">
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <label className="block mb-2">Nombre</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full p-2 rounded mb-4" />
      <label className="block mb-2">Descripción</label>
      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full p-2 rounded mb-4" />
      <label className="block mb-2">Precio</label>
      <input type="number" value={precio} onChange={(e) => setPrecio(Number(e.target.value))} className="w-full p-2 rounded mb-4" />
      <label className="block mb-2">Stock</label>
      <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="w-full p-2 rounded mb-4" />
      <label className="block mb-2">Categoría</label>
      <input value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-2 rounded mb-4" />
      <label className="block mb-2">Imagen (URL)</label>
      <input value={imagen} onChange={(e) => setImagen(e.target.value)} className="w-full p-2 rounded mb-4" />
      <button className="px-4 py-2 bg-primary rounded text-primary-contrast">Guardar</button>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </form>
  );
}
