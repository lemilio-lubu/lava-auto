import Link from 'next/link';
import { notFound } from 'next/navigation';
import * as productoService from '@/services/producto.service';

export default async function ProductoDetailPage({ params }: { params: { id: string } }) {
  const producto = await productoService.findById(params.id);
  
  if (!producto) {
    notFound();
  }

  return (
    <section>
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard/productos" className="text-on-surface-muted hover:text-on-surface">
          ← Volver
        </Link>
        <h2 className="text-xl font-semibold">{producto.nombre}</h2>
      </div>
      
      <div className="bg-surface-muted rounded p-6 max-w-xl">
        {producto.imagen && (
          <img src={producto.imagen} alt={producto.nombre} className="w-full h-48 object-cover rounded mb-4" />
        )}
        
        <div className="space-y-3">
          <div>
            <span className="text-on-surface-muted">Descripción:</span>
            <p>{producto.descripcion || 'Sin descripción'}</p>
          </div>
          
          <div>
            <span className="text-on-surface-muted">Precio:</span>
            <p className="text-2xl font-bold text-primary">${producto.precio.toFixed(2)}</p>
          </div>
          
          <div>
            <span className="text-on-surface-muted">Stock:</span>
            <p>{producto.stock} unidades</p>
          </div>
          
          <div>
            <span className="text-on-surface-muted">Categoría:</span>
            <p>{producto.categoria}</p>
          </div>
          
          <div>
            <span className="text-on-surface-muted">Estado:</span>
            <p>{producto.activo ? '✅ Activo' : '❌ Inactivo'}</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <Link 
            href={`/dashboard/productos/${producto.id}/editar`} 
            className="px-4 py-2 bg-primary rounded text-primary-contrast hover:opacity-90"
          >
            Editar
          </Link>
          <DeleteButton id={producto.id} />
        </div>
      </div>
    </section>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={`/api/productos/${id}`} method="DELETE">
      <button 
        type="submit" 
        className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
        onClick={(e) => {
          if (!confirm('¿Estás seguro de eliminar este producto?')) {
            e.preventDefault();
          }
        }}
      >
        Eliminar
      </button>
    </form>
  );
}
