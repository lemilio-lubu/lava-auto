const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Mapa de usuarios conectados
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Registrar usuario cuando se conecta
    socket.on('register', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`Usuario ${userId} registrado con socket ${socket.id}`);
    });

    // Enviar mensaje
    socket.on('send-message', async (data) => {
      try {
        const { senderId, receiverId, content } = data;

        // Guardar mensaje en la base de datos
        const message = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId,
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
        });

        // Enviar al remitente
        socket.emit('new-message', message);

        // Enviar al destinatario si está conectado
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new-message', message);
        }

        console.log(`Mensaje enviado de ${senderId} a ${receiverId}`);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('message-error', { error: 'Error al enviar mensaje' });
      }
    });

    // Marcar mensajes como leídos
    socket.on('mark-as-read', async (data) => {
      try {
        const { senderId, receiverId } = data;

        await prisma.message.updateMany({
          where: {
            senderId,
            receiverId,
            read: false,
          },
          data: {
            read: true,
          },
        });

        socket.emit('messages-read', { senderId, receiverId });
      } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`Usuario ${socket.userId} desconectado`);
      }
      console.log('Usuario desconectado:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Servidor listo en http://${hostname}:${port}`);
      console.log(`> Socket.IO configurado y escuchando`);
    });
});
