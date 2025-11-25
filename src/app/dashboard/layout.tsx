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
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border p-4 bg-surface-muted">
        <h3 className="text-lg font-bold text-primary">🚗 Autolavado</h3>
        <nav className="mt-6 flex flex-col gap-2">
          <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
          <Link href="/dashboard/chat" className="hover:text-primary">Chat</Link>
          <Link href="/dashboard/productos" className="hover:text-primary">Productos</Link>
        </nav>
        <div className="mt-auto pt-8">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm text-on-surface-muted hover:text-red-400">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
