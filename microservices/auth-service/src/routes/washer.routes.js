/**
 * Washer Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/user.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all available washers
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { available } = req.query;
    const washers = await userRepo.findWashers({ 
      available: available === 'true' ? true : available === 'false' ? false : undefined 
    });
    
    // Transformar a camelCase para el frontend
    const formattedWashers = washers.map(w => ({
      id: w.id,
      name: w.name,
      email: w.email,
      phone: w.phone,
      isAvailable: w.is_available,
      rating: parseFloat(w.rating) || 0,
      completedServices: parseInt(w.completed_services) || 0,
      address: w.address,
      latitude: w.latitude,
      longitude: w.longitude
    }));
    
    res.json(formattedWashers);
  } catch (error) {
    next(error);
  }
});

// Get washer by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const washer = await userRepo.findById(req.params.id);
    if (!washer || washer.role !== 'WASHER') {
      return res.status(404).json({ error: 'Washer not found' });
    }

    res.json({
      id: washer.id,
      name: washer.name,
      phone: washer.phone,
      isAvailable: washer.is_available,
      rating: washer.rating,
      completedServices: washer.completed_services,
      latitude: washer.latitude,
      longitude: washer.longitude
    });
  } catch (error) {
    next(error);
  }
});

// Toggle availability (washer only)
router.put('/availability', authMiddleware, roleMiddleware('WASHER'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { isAvailable } = req.body;
    if (isAvailable === undefined) {
      return res.status(400).json({ error: 'isAvailable is required' });
    }

    const washer = await userRepo.updateAvailability(req.user.id, isAvailable);
    res.json({ isAvailable: washer.is_available });
  } catch (error) {
    next(error);
  }
});

// Update washer location
router.put('/location', authMiddleware, roleMiddleware('WASHER'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const washer = await userRepo.updateLocation(req.user.id, latitude, longitude);
    res.json({
      latitude: washer.latitude,
      longitude: washer.longitude
    });
  } catch (error) {
    next(error);
  }
});

// Get washer stats
router.get('/:id/stats', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const washer = await userRepo.findById(req.params.id);
    if (!washer || washer.role !== 'WASHER') {
      return res.status(404).json({ error: 'Washer not found' });
    }

    res.json({
      completedServices: washer.completed_services,
      rating: washer.rating,
      isAvailable: washer.is_available
    });
  } catch (error) {
    next(error);
  }
});

// Register new washer (admin only)
router.post('/register', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    // Check if user exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create washer
    const washer = await userRepo.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: 'WASHER'
    });

    res.status(201).json({
      message: 'Lavador registrado exitosamente',
      washer: {
        id: washer.id,
        name: washer.name,
        email: washer.email,
        phone: washer.phone,
        role: washer.role
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
