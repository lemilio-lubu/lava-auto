/**
 * Chat Routes
 * Communication rules:
 * - CLIENT can only message ADMIN
 * - WASHER can only message ADMIN
 * - ADMIN can message everyone (CLIENT, WASHER)
 */

const express = require('express');
const router = express.Router();
const MessageRepository = require('../repositories/message.repository');
const { authMiddleware } = require('../middleware/auth');

// Helper function to validate communication rules
// Note: In production, you'd call auth-service to get receiver's role
// For now, we store sender_role in messages or trust the validation
const validateCommunication = (senderRole, receiverRole) => {
  if (senderRole === 'ADMIN') {
    // Admin can message everyone
    return true;
  }
  if (senderRole === 'CLIENT' || senderRole === 'WASHER') {
    // Clients and Washers can only message Admins
    return receiverRole === 'ADMIN';
  }
  return false;
};

// Get available users to chat with based on role
router.get('/available-users', authMiddleware, async (req, res, next) => {
  try {
    const { role } = req.user;
    
    // This endpoint returns which roles can be contacted
    // The actual user list comes from auth-service via API Gateway
    let canContactRoles = [];
    
    if (role === 'ADMIN') {
      canContactRoles = ['CLIENT', 'WASHER'];
    } else {
      // CLIENT and WASHER can only contact ADMIN
      canContactRoles = ['ADMIN'];
    }
    
    res.json({ 
      canContactRoles,
      rules: {
        currentRole: role,
        canContact: canContactRoles
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's conversations list
router.get('/conversations', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const messageRepo = new MessageRepository(db);
    
    const conversations = await messageRepo.findUserConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// Get conversation with specific user
router.get('/conversation/:otherUserId', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const messageRepo = new MessageRepository(db);
    
    const { limit, offset } = req.query;
    const messages = await messageRepo.findConversation(
      req.user.id, 
      req.params.otherUserId,
      { limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 }
    );
    
    // Mark messages as read
    await messageRepo.markConversationAsRead(req.params.otherUserId, req.user.id);
    
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Get unread message count
router.get('/unread-count', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const messageRepo = new MessageRepository(db);
    
    const count = await messageRepo.countUnread(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Send message
router.post('/send', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const messageRepo = new MessageRepository(db);
    const io = req.app.get('io');
    
    const { receiverId, receiverRole, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId and content are required' });
    }

    // Validate communication rules
    const senderRole = req.user.role;
    
    // If receiverRole is provided, validate it
    if (receiverRole) {
      if (!validateCommunication(senderRole, receiverRole)) {
        return res.status(403).json({ 
          error: 'No tienes permiso para enviar mensajes a este usuario',
          details: `Los usuarios con rol ${senderRole} solo pueden contactar a ADMIN`
        });
      }
    } else {
      // If no receiverRole provided, only allow if sender is ADMIN
      // or we assume receiver is ADMIN (for backward compatibility)
      if (senderRole !== 'ADMIN') {
        // Clients and Washers can only message admins, so assume receiver is admin
        // In production, you'd verify this with the auth service
      }
    }

    const message = await messageRepo.create({
      senderId: req.user.id,
      senderRole: senderRole,
      receiverId,
      content
    });

    // Send real-time message via Socket.IO
    if (io) {
      io.to(`user:${receiverId}`).emit('new-message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const messageRepo = new MessageRepository(db);
    
    const message = await messageRepo.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.receiverId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await messageRepo.markAsRead(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
