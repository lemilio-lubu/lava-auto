import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

/**
 * Redirige a los usuarios según su rol al dashboard correspondiente
 */
export function redirectByRole(userRole: UserRole, currentPath: string) {
  const roleRedirects = {
    CLIENT: '/dashboard/client',
    WASHER: '/dashboard/washer',
    ADMIN: '/dashboard/admin',
  };

  const targetPath = roleRedirects[userRole];
  
  // Solo redirigir si no está ya en su dashboard correcto
  if (!currentPath.startsWith(targetPath)) {
    redirect(targetPath);
  }
}

/**
 * Verifica si un usuario puede acceder a una ruta específica
 */
export function canAccessRoute(userRole: UserRole, path: string): boolean {
  // ADMIN puede acceder a todo
  if (userRole === 'ADMIN') {
    return true;
  }

  // CLIENT solo puede acceder a rutas de cliente
  if (userRole === 'CLIENT') {
    return path.startsWith('/dashboard/client') || 
           path.startsWith('/api/reservations') ||
           path.startsWith('/api/vehicles') ||
           path.startsWith('/api/ratings') ||
           path.startsWith('/api/notifications');
  }

  // WASHER solo puede acceder a rutas de lavador
  if (userRole === 'WASHER') {
    return path.startsWith('/dashboard/washer') ||
           path.startsWith('/api/jobs') ||
           path.startsWith('/api/service-proof') ||
           path.startsWith('/api/washers') ||
           path.startsWith('/api/notifications');
  }

  return false;
}
