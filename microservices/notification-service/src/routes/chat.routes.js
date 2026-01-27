/**
 * Chat Routes
 */

const express = require('express');
const router = express.Router();
const MessageRepository = require('../repositories/message.repository');
const { authMiddleware } = require('../middleware/auth');

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
    
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId and content are required' });
    }

    const message = await messageRepo.create({
      senderId: req.user.id,
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
