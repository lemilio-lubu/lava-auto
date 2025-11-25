import { notFound } from 'next/navigation';
import * as productoService from '@/services/producto.service';
import ProductoForm from '@/components/productos/ProductoForm';

export default async function EditarProductoPage({ params }: { params: { id: string } }) {
  const producto = await productoService.findById(params.id);
  
  if (!producto) {
    notFound();
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Editar Producto</h2>
      <ProductoForm initial={producto} />
    </section>
  );
}
