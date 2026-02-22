/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const NotificationRepository = require('../repositories/notification.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get user's notifications
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const notificationRepo = new NotificationRepository(db);
    
    const { unreadOnly } = req.query;
    const notifications = await notificationRepo.findByUserId(req.user.id, {
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const notificationRepo = new NotificationRepository(db);
    
    const count = await notificationRepo.countUnread(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Create notification (internal/admin)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const notificationRepo = new NotificationRepository(db);
    const io = req.app.get('io');
    
    const { userId, title, message, type, actionUrl, metadata } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'userId, title and message are required' });
    }

    const notification = await notificationRepo.create({
      userId,
      title,
      message,
      type,
      actionUrl,
      metadata
    });

    // Send real-time notification via Socket.IO
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const notificationRepo = new NotificationRepository(db);
    
    const notification = await notificationRepo.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await notificationRepo.markAsRead(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const notificationRepo = new NotificationRepository(db);
    
    await notificationRepo.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const notificationRepo = new NotificationRepository(db);
    
    const notification = await notificationRepo.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await notificationRepo.delete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
