'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, Car, LogOut, Droplets, User, MessageCircle,
  Briefcase, Users, Settings, BarChart, Home, Bell, Loader2,
  Menu, X
} from 'lucide-react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [availableJobsCount] = useState(0); // TODO: fetch from API
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Nielsen: Reconocer antes que recordar - Navegación según el rol del usuario
  const getNavItemsByRole = () => {
    switch (user.role) {
      case 'CLIENT':
        return [
          {
            icon: Home,
            label: 'Inicio',
            href: '/dashboard/client',
            description: 'Panel principal',
          },
          {
            icon: Calendar,
            label: 'Solicitar Servicio',
            href: '/dashboard/client/nueva-reserva',
            description: 'Pide tu servicio',
          },
          {
            icon: Calendar,
            label: 'Mis Reservas',
            href: '/dashboard/client/reservas',
            description: 'Historial de servicios',
          },
          {
            icon: Car,
            label: 'Mis Vehículos',
            href: '/dashboard/client/vehiculos',
            description: 'Administra vehículos',
          },
          {
            icon: MessageCircle,
            label: 'Chat',
            href: '/dashboard/chat',
            description: 'Mensajes con admin',
          },
        ];

      case 'WASHER':
        return [
          {
            icon: Home,
            label: 'Inicio',
            href: '/dashboard/washer',
            description: 'Panel principal',
          },
          {
            icon: Bell,
            label: 'Disponibles',
            href: '/dashboard/washer/disponibles',
            description: 'Trabajos nuevos',
            badge: true,
          },
          {
            icon: Briefcase,
            label: 'Mis Trabajos',
            href: '/dashboard/washer/trabajos',
            description: 'Trabajos asignados',
          },
          {
            icon: BarChart,
            label: 'Mis Estadísticas',
            href: '/dashboard/washer/estadisticas',
            description: 'Ganancias y rendimiento',
          },
          {
            icon: MessageCircle,
            label: 'Chat',
            href: '/dashboard/chat',
            description: 'Mensajes con admin',
          },
        ];

      case 'ADMIN':
        return [
          {
            icon: Home,
            label: 'Dashboard',
            href: '/dashboard/admin',
            description: 'Vista general',
          },
          {
            icon: Users,
            label: 'Usuarios',
            href: '/dashboard/admin/usuarios',
            description: 'Clientes y lavadores',
          },
          {
            icon: Briefcase,
            label: 'Lavadores',
            href: '/dashboard/admin/lavadores',
            description: 'Gestionar lavadores',
          },
          {
            icon: Calendar,
            label: 'Reservas',
            href: '/dashboard/admin/reservas',
            description: 'Todas las reservas',
          },
          {
            icon: Droplets,
            label: 'Servicios',
            href: '/dashboard/admin/servicios',
            description: 'Gestionar servicios',
          },
          {
            icon: MessageCircle,
            label: 'Chat',
            href: '/dashboard/chat',
            description: 'Mensajes',
          },
          {
            icon: BarChart,
            label: 'Reportes',
            href: '/dashboard/admin/reportes',
            description: 'Análisis y métricas',
          },
          {
            icon: Settings,
            label: 'Configuración',
            href: '/dashboard/admin/configuracion',
            description: 'Ajustes del sistema',
          },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItemsByRole();
  
  const getRoleBadge = () => {
    switch (user.role) {
      case 'CLIENT':
        return { label: 'Cliente', color: 'bg-blue-500' };
      case 'WASHER':
        return { label: 'Lavador', color: 'bg-green-500' };
      case 'ADMIN':
        return { label: 'Admin', color: 'bg-purple-500' };
      default:
        return { label: 'Usuario', color: 'bg-slate-500' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <ThemeProvider>
    <div className="min-h-screen flex bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 flex flex-col
        border-r border-cyan-100 dark:border-slate-700
        bg-white dark:bg-slate-800
        backdrop-blur-sm shadow-sm
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}>
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-cyan-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl p-2.5 shadow-md">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lava Auto</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Microservicios</p>
              </div>
            </div>
            {/* Botón cerrar — solo mobile */}
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Usuario actual */}
        <div className="px-6 py-4 bg-cyan-50/50 dark:bg-slate-700/50 border-b border-cyan-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user.name || user.email}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            {user.role === 'ADMIN' ? 'Administración' : user.role === 'WASHER' ? 'Lavador' : 'Cliente'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const showBadge = item.badge && user.role === 'WASHER' && availableJobsCount > 0;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-200
                  group
                  relative
                  ${isActive 
                    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' 
                    : 'text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <div className={`p-2 rounded-lg transition-colors relative ${
                  isActive 
                    ? 'bg-cyan-200 dark:bg-cyan-800' 
                    : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30'
                }`}>
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-[10px] font-bold">{availableJobsCount}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer con Theme Toggle y Logout */}
        <div className="p-4 border-t border-cyan-100 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema</span>
            <ThemeToggle />
          </div>
          
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300
              hover:bg-red-50 dark:hover:bg-red-900/20
              transition-all duration-200
              group
            "
          >
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-cyan-100 dark:border-slate-700 px-4 md:px-8 py-4 md:py-6 shadow-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 justify-between">
              {/* Hamburger button — solo mobile */}
              <button
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {user.role === 'ADMIN' 
                    ? 'Panel de Administración' 
                    : user.role === 'WASHER'
                    ? 'Panel del Lavador'
                    : 'Mi Panel'}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                  {user.role === 'ADMIN'
                    ? 'Gestiona todo el sistema de autolavado'
                    : user.role === 'WASHER'
                    ? 'Gestiona tus trabajos y ganancias'
                    : 'Solicita y gestiona tus servicios de lavado'}
                </p>
              </div>
              
              <div className="text-right hidden md:block flex-shrink-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Conectado a microservicios</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </div>
      </main>
    </div>
    </ThemeProvider>
  );
}
