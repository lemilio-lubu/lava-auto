import Link from 'next/link';
import * as productoService from '@/services/producto.service';

export default async function ProductosPage({ searchParams }: { searchParams?: any }) {
  const q = searchParams?.q as string | undefined;
  const categoria = searchParams?.categoria as string | undefined;
  const productos = await productoService.findAll({ q, categoria });
  const categorias = await productoService.getCategories();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Productos</h2>
        <Link href="/dashboard/productos/nuevo" className="px-4 py-2 bg-primary rounded text-primary-contrast hover:opacity-90">
          + Nuevo Producto
        </Link>
      </div>
      
      <div className="mb-4">
        <select name="categoria" className="p-2 rounded bg-surface-muted border border-border text-on-surface">
          <option value="">Todas las categorías</option>
          {categorias.map((c: string, index: number) => (
            <option key={`cat-${index}-${c}`} value={c}>{c}</option>
          ))}
        </select>
      </div>
      
      {productos.length === 0 ? (
        <p className="text-on-surface-muted">No hay productos. ¡Crea el primero!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map((p: any) => (
            <div key={p.id} className="p-4 bg-surface-muted rounded border border-border">
              <h3 className="font-semibold text-lg">{p.nombre}</h3>
              <p className="text-sm text-on-surface-muted mt-1">{p.descripcion || 'Sin descripción'}</p>
              <p className="font-bold text-primary mt-2">${p.precio.toFixed(2)}</p>
              <p className="text-xs text-on-surface-muted">Stock: {p.stock}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/dashboard/productos/${p.id}`} className="px-3 py-1 border border-border rounded hover:bg-surface">
                  Ver
                </Link>
                <Link href={`/dashboard/productos/${p.id}/editar`} className="px-3 py-1 border border-border rounded hover:bg-surface">
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
