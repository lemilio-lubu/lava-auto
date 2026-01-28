'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Loader2, UserCog, Shield } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

export default function UsuariosPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CLIENT' | 'WASHER' | 'ADMIN'>('ALL');

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    loadUsers();
  }, [user, token, authLoading, router]);

  const loadUsers = async () => {
    if (!token) return;
    try {
      const data = await adminApi.getUsers(token);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const filteredUsers = filter === 'ALL' ? users : users.filter(u => u.role === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Administra todos los usuarios del sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'ALL'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          Todos ({users.length})
        </button>
        <button
          onClick={() => setFilter('CLIENT')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'CLIENT'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          Clientes ({users.filter(u => u.role === 'CLIENT').length})
        </button>
        <button
          onClick={() => setFilter('WASHER')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'WASHER'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          Lavadores ({users.filter(u => u.role === 'WASHER').length})
        </button>
        <button
          onClick={() => setFilter('ADMIN')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'ADMIN'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          Administradores ({users.filter(u => u.role === 'ADMIN').length})
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Teléfono
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-slate-900 dark:text-white">{u.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                      u.role === 'WASHER' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {u.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1 inline" />}
                      {u.role === 'WASHER' && <UserCog className="w-3 h-3 mr-1 inline" />}
                      {u.role === 'CLIENT' && <Users className="w-3 h-3 mr-1 inline" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {u.phone || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
