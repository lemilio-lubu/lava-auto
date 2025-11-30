import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, Search, Shield, User, Wrench } from 'lucide-react';

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    include: {
      vehicles: true,
      reservations: true,
      assignedJobs: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === 'CLIENT').length,
    washers: users.filter((u) => u.role === 'WASHER').length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
  };

  const roleIcons = {
    CLIENT: User,
    WASHER: Wrench,
    ADMIN: Shield,
  };

  const roleColors = {
    CLIENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    WASHER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const roleLabels = {
    CLIENT: 'Cliente',
    WASHER: 'Lavador',
    ADMIN: 'Administrador',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Administra clientes, lavadores y administradores
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/admin/usuarios/nuevo"
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Usuarios</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Clientes</p>
          </div>
          <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.clients}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Lavadores</p>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.washers}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Admins</p>
          </div>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.admins}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar usuarios por nombre, email o rol..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <select className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-slate-700 dark:text-white">
            <option value="">Todos los roles</option>
            <option value="CLIENT">Clientes</option>
            <option value="WASHER">Lavadores</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Usuario
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Rol
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Contacto
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Estadísticas
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Registro
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const RoleIcon = roleIcons[u.role];
                return (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-white font-bold">
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                          roleColors[u.role]
                        }`}
                      >
                        <RoleIcon className="w-4 h-4" />
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {u.phone && (
                          <p className="text-slate-900 dark:text-white">{u.phone}</p>
                        )}
                        {u.address && (
                          <p className="text-slate-600 dark:text-slate-400 truncate max-w-xs">
                            {u.address}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {u.role === 'CLIENT' && (
                          <>
                            <p className="text-slate-900 dark:text-white">
                              {u.vehicles.length} vehículos
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              {u.reservations.length} reservas
                            </p>
                          </>
                        )}
                        {u.role === 'WASHER' && (
                          <>
                            <p className="text-slate-900 dark:text-white">
                              {u.assignedJobs.filter((j) => j.status === 'COMPLETED').length}{' '}
                              completados
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              {u.assignedJobs.length} total trabajos
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors">
                          Ver
                        </button>
                        <button className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
