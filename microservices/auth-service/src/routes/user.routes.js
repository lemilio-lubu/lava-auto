/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const UserRepository = require('../repositories/user.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { role, limit, offset } = req.query;
    const users = await userRepo.findAll({ role, limit: parseInt(limit) || 100, offset: parseInt(offset) || 0 });
    
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const user = await userRepo.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only return full info to admins or the user themselves
    if (req.user.role !== 'ADMIN' && req.user.id !== user.id) {
      return res.json({
        id: user.id,
        name: user.name,
        rating: user.rating
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      isAvailable: user.is_available,
      rating: user.rating,
      completedServices: user.completed_services,
      createdAt: user.created_at
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    // Users can only update themselves, admins can update anyone
    if (req.user.role !== 'ADMIN' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await userRepo.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const result = await userRepo.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update location
router.put('/:id/location', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const user = await userRepo.updateLocation(req.params.id, latitude, longitude);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
