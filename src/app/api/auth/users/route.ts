import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea ADMIN
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No tienes permisos para crear usuarios' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone, role } = body;

    // Validar campos requeridos
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y rol son requeridos' },
        { status: 400 }
      );
    }

    // Validar rol (solo WASHER o ADMIN)
    if (role !== 'WASHER' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo puedes crear usuarios con rol WASHER o ADMIN' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
        // Campos específicos para WASHER
        ...(role === 'WASHER' && {
          isAvailable: true,
          rating: 5.0,
          completedServices: 0,
          latitude: null, // Se actualizará al iniciar sesión
          longitude: null, // Se actualizará al iniciar sesión
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: `${role === 'WASHER' ? 'Lavador' : 'Administrador'} creado exitosamente`,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}

