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

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated`);
  });

  socket.on('join-chat', (roomId) => {
    socket.join(`chat:${roomId}`);
    console.log(`Socket ${socket.id} joined chat:${roomId}`);
  });

  socket.on('leave-chat', (roomId) => {
    socket.leave(`chat:${roomId}`);
  });

  socket.on('send-message', async (data) => {
    const { receiverId, content } = data;
    
    // Emit to receiver
    io.to(`user:${receiverId}`).emit('new-message', {
      senderId: socket.userId,
      content,
      createdAt: new Date()
    });
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
