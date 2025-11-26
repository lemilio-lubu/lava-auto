import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Car, Sparkles, LogOut, Droplets, User } from 'lucide-react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // Nielsen: Reconocer antes que recordar - Navegación clara y visible
  const navItems = [
    {
      icon: Calendar,
      label: 'Reservas',
      href: '/dashboard',
      description: 'Gestiona tus reservas',
    },
    {
      icon: Car,
      label: 'Vehículos',
      href: '/dashboard/vehiculos',
      description: 'Administra vehículos',
    },
    {
      icon: Sparkles,
      label: 'Servicios',
      href: '/dashboard/servicios',
      description: 'Ver servicios disponibles',
    },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-cyan-50 via-white to-emerald-50">
      {/* Nielsen: Consistencia y estándares - Sidebar fijo con navegación clara */}
      <aside className="w-72 border-r border-cyan-100 bg-white/80 backdrop-blur-sm flex flex-col shadow-sm">
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-cyan-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl p-2.5 shadow-md">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Autolavado</h3>
              <p className="text-xs text-slate-500">Sistema Digital</p>
            </div>
          </div>
        </div>

        {/* Nielsen: Visibilidad del estado - Usuario actual visible */}
        <div className="px-6 py-4 bg-cyan-50/50 border-b border-cyan-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {session.user?.name || session.user?.email}
              </p>
              <p className="text-xs text-slate-500">Usuario activo</p>
            </div>
          </div>
        </div>

        {/* Nielsen: Diseño estético y minimalista - Navegación limpia */}
        <nav className="flex-1 p-4 space-y-2">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Menú Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  text-slate-700 hover:text-cyan-600
                  hover:bg-cyan-50
                  transition-all duration-200
                  group
                "
              >
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-cyan-100 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Nielsen: Control y libertad - Cerrar sesión claramente visible */}
        <div className="p-4 border-t border-cyan-100">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                text-red-600 hover:text-red-700
                hover:bg-red-50
                transition-all duration-200
                group
              "
            >
              <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Nielsen: Visibilidad del estado - Header con breadcrumbs */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-cyan-100 px-8 py-6 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Panel de Control
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Gestiona tus reservas y servicios de autolavado
                </p>
              </div>
              
              {/* Nielsen: Visibilidad del estado - Indicador de tiempo */}
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-slate-500">Última actualización: ahora</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
