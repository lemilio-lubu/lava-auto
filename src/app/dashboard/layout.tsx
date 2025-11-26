import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 border-r border-gray-200 p-4 bg-white">
        <h3 className="text-lg font-bold text-blue-600">🚗 Autolavado</h3>
        <nav className="mt-6 flex flex-col gap-2">
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-blue-50">Reservas</Link>
          <Link href="/dashboard/vehiculos" className="text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-blue-50">Vehículos</Link>
          <Link href="/dashboard/servicios" className="text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-blue-50">Servicios</Link>
        </nav>
        <div className="mt-auto pt-8">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm text-gray-600 hover:text-red-600">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
