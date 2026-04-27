'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Loader2, UserCog, Shield, Lock, Eye, EyeOff, X } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

interface PasswordModalState {
  userId: string;
  userName: string;
}

export default function UsuariosPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CLIENT' | 'EMPLOYEE' | 'ADMIN'>('ALL');

  const [pwModal, setPwModal] = useState<PasswordModalState | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const openPwModal = (u: { id: string; name: string }) => {
    setPwModal({ userId: u.id, userName: u.name });
    setNewPassword('');
    setPwError('');
    setShowPassword(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !pwModal) return;
    setPwError('');

    if (newPassword.length < 6) {
      setPwError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setPwLoading(true);
    try {
      await adminApi.setUserPassword(pwModal.userId, newPassword, token);
      setSuccessMsg(`Contraseña de ${pwModal.userName} actualizada. El usuario deberá cambiarla al iniciar sesión.`);
      setPwModal(null);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setPwError(err.message ?? 'Error al cambiar la contraseña.');
    } finally {
      setPwLoading(false);
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

  const filterBtnClass = (active: boolean) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      active
        ? 'bg-purple-600 text-white'
        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
        <p className="text-slate-600 dark:text-slate-400">Administra todos los usuarios del sistema</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 rounded-lg px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('ALL')} className={filterBtnClass(filter === 'ALL')}>
          Todos ({users.length})
        </button>
        <button onClick={() => setFilter('CLIENT')} className={filterBtnClass(filter === 'CLIENT')}>
          Clientes ({users.filter(u => u.role === 'CLIENT').length})
        </button>
        <button onClick={() => setFilter('EMPLOYEE')} className={filterBtnClass(filter === 'EMPLOYEE')}>
          Técnicos ({users.filter(u => u.role === 'EMPLOYEE').length})
        </button>
        <button onClick={() => setFilter('ADMIN')} className={filterBtnClass(filter === 'ADMIN')}>
          Administradores ({users.filter(u => u.role === 'ADMIN').length})
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{u.name}</div>
                        {u.mustChangePassword && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">Debe cambiar contraseña</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                      u.role === 'ADMIN'     ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                      u.role === 'EMPLOYEE'  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {u.role === 'ADMIN'    && <Shield className="w-3 h-3 mr-1" />}
                      {u.role === 'EMPLOYEE' && <UserCog className="w-3 h-3 mr-1" />}
                      {u.role === 'CLIENT'   && <Users className="w-3 h-3 mr-1" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{u.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openPwModal(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Cambiar contraseña
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cambiar contraseña
              </h3>
              <button onClick={() => setPwModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              Establecer nueva contraseña para <span className="font-semibold text-slate-900 dark:text-white">{pwModal.userName}</span>.
              El usuario deberá cambiarla al iniciar sesión.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pwError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {pwError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPwModal(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Establecer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
