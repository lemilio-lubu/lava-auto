import prisma from '@/lib/prisma';

export default async function DashboardPage() {
  const users = await prisma.user.count();
  const productos = await prisma.producto.count();
  const reservas = await prisma.reservation.count();

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded bg-surface-muted">
          <h3 className="text-on-surface-muted">Usuarios</h3>
          <p className="text-3xl font-bold">{users}</p>
        </div>
        <div className="p-4 rounded bg-surface-muted">
          <h3 className="text-on-surface-muted">Productos</h3>
          <p className="text-3xl font-bold">{productos}</p>
        </div>
        <div className="p-4 rounded bg-surface-muted">
          <h3 className="text-on-surface-muted">Reservas</h3>
          <p className="text-3xl font-bold">{reservas}</p>
        </div>
      </div>
    </section>
  );
}
