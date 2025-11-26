import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener conversaciones (mensajes únicos por usuario)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agrupar por usuario y obtener el último mensaje y conteo de no leídos
    const conversationsMap = new Map();

    for (const message of messages) {
      const otherUser = message.senderId === currentUser.id ? message.receiver : message.sender;
      
      if (!conversationsMap.has(otherUser.id)) {
        // Contar mensajes no leídos de este usuario
        const unreadCount = await prisma.message.count({
          where: {
            senderId: otherUser.id,
            receiverId: currentUser.id,
            read: false,
          },
        });

        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: message,
          unreadCount,
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return NextResponse.json({ error: 'Error al obtener conversaciones' }, { status: 500 });
  }
}
