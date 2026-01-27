/**
 * Notification Service - Main Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const Database = require('./database/db');
const notificationRoutes = require('./routes/notification.routes');
const chatRoutes = require('./routes/chat.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4005;

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize database
const db = new Database({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

app.set('db', db);
app.set('io', io);

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'notification-service',
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO connection handling
const connectedUsers = new Map();

// Helper function to validate communication rules
const validateCommunication = (senderRole, receiverRole) => {
  if (senderRole === 'ADMIN') {
    return true; // Admin can message everyone
  }
  if (senderRole === 'CLIENT' || senderRole === 'WASHER') {
    return receiverRole === 'ADMIN'; // Can only message admins
  }
  return false;
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (data) => {
    const { userId, userRole } = typeof data === 'object' ? data : { userId: data, userRole: null };
    connectedUsers.set(userId, { socketId: socket.id, role: userRole });
    socket.userId = userId;
    socket.userRole = userRole;
    socket.join(`user:${userId}`);
    console.log(`User ${userId} (${userRole}) registered`);
  });

  // Legacy authenticate event for backward compatibility
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, { socketId: socket.id, role: null });
    socket.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated (legacy)`);
  });

  socket.on('join-chat', (roomId) => {
    socket.join(`chat:${roomId}`);
    console.log(`Socket ${socket.id} joined chat:${roomId}`);
  });

  socket.on('leave-chat', (roomId) => {
    socket.leave(`chat:${roomId}`);
  });

  socket.on('send-message', async (data) => {
    const { receiverId, receiverRole, content } = data;
    
    // Validate communication rules if roles are known
    if (socket.userRole && receiverRole) {
      if (!validateCommunication(socket.userRole, receiverRole)) {
        socket.emit('error', { 
          message: 'No tienes permiso para enviar mensajes a este usuario' 
        });
        return;
      }
    }
    
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: socket.userId,
      senderRole: socket.userRole,
      receiverId,
      content,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    // Emit ONLY to receiver (sender already has the message via optimistic update)
    io.to(`user:${receiverId}`).emit('new-message', messageData);
  });

  socket.on('mark-as-read', async (data) => {
    const { senderId, receiverId } = data;
    // Notify sender that messages were read
    io.to(`user:${senderId}`).emit('messages-read', { senderId, receiverId });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally for notifications
global.io = io;

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
});

module.exports = { app, io };
