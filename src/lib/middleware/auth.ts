import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export type UserRole = 'ADMIN' | 'CLIENT' | 'WASHER';

// Extender el tipo de sesión
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
}

/**
 * Middleware para proteger rutas por rol
 * @param allowedRoles - Array de roles permitidos
 * @param handler - Función handler de la ruta
 */
export function requireRole(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);

      // Verificar si hay sesión
      if (!session?.user) {
        return NextResponse.json(
          { error: 'No autenticado. Por favor inicia sesión.' },
          { status: 401 }
        );
      }

      // Verificar si el rol del usuario está permitido
      const userRole = session.user.role || 'CLIENT';
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { 
            error: 'No tienes permisos para acceder a este recurso.',
            requiredRoles: allowedRoles,
            yourRole: userRole,
          },
          { status: 403 }
        );
      }

      // Si pasa todas las validaciones, ejecutar el handler
      return handler(req, session);
    } catch (error) {
      console.error('Error en middleware de autorización:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  };
}

/**
 * Verificar si el usuario tiene un rol específico
 */
export function hasRole(session: any, role: UserRole): boolean {
  return session?.user?.role === role;
}

/**
 * Verificar si el usuario tiene alguno de los roles especificados
 */
export function hasAnyRole(session: any, roles: UserRole[]): boolean {
  return roles.includes(session?.user?.role);
}

/**
 * Obtener el rol del usuario de la sesión
 */
export function getUserRole(session: any): UserRole {
  return session?.user?.role || 'CLIENT';
}

/**
 * Verificar permisos de administrador
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === 'ADMIN';
}

/**
 * Verificar permisos de washer
 */
export function isWasher(session: any): boolean {
  return session?.user?.role === 'WASHER';
}

/**
 * Verificar permisos de cliente
 */
export function isClient(session: any): boolean {
  return session?.user?.role === 'CLIENT';
}

/**
 * Obtener datos del usuario actual desde la sesión
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  
  const { default: prisma } = await import('@/lib/prisma');
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      latitude: true,
      longitude: true,
      address: true,
      isAvailable: true,
      rating: true,
      completedServices: true,
    },
  });
}
