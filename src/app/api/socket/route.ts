import { Server } from 'socket.io';
import { NextResponse } from 'next/server';
import { NextApiRequest } from 'next';
import prisma from '@/lib/prisma';

// This route upgrades the underlying Node server to host a socket.io instance.
export async function GET(req: Request) {
  // Next.js App Router doesn't expose res.socket.server the same way; this is an adaptation.
  // We'll attach io to globalThis to avoid multiple instances.
  const anyGlobal: any = globalThis as any;
  if (anyGlobal.io) return NextResponse.json({ ok: true });

  // Create a minimal server (Socket.IO will bind to the same HTTP server via adapter in production.
  const io = new Server({ path: '/api/socket' });
  anyGlobal.io = io;

  io.on('connection', (socket) => {
    socket.join('general');
    socket.on('send-message', async (data) => {
      try {
        await prisma.message.create({ data: { content: data.content, userId: data.userId } });
      } catch (e) {
        // ignore
      }
      io.to('general').emit('new-message', { ...data, createdAt: new Date().toISOString() });
    });
  });

  return NextResponse.json({ ok: true });
}
