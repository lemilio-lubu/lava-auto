/**
 * Service Routes
 */

const express = require('express');
const router = express.Router();
const ServiceRepository = require('../repositories/service.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all services (public-ish, but needs auth through gateway)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const serviceRepo = new ServiceRepository(db);
    
    const { vehicleType } = req.query;
    // Admin ve todos los servicios (activos e inactivos), otros usuarios solo activos
    const activeOnly = req.user.role !== 'ADMIN';
    const services = await serviceRepo.findAll({ vehicleType, activeOnly });
    
    res.json(services);
  } catch (error) {
    next(error);
  }
});

// Get services by vehicle type
router.get('/type/:vehicleType', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const serviceRepo = new ServiceRepository(db);
    
    const services = await serviceRepo.findByVehicleType(req.params.vehicleType);
    res.json(services);
  } catch (error) {
    next(error);
  }
});

// Get service by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const serviceRepo = new ServiceRepository(db);
    
    const service = await serviceRepo.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    next(error);
  }
});

// Create service (admin only)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const serviceRepo = new ServiceRepository(db);
    
    const { name, description, duration, price, vehicleType, isActive } = req.body;

    if (!name || !duration || !price || !vehicleType) {
      return res.status(400).json({ 
        error: 'Name, duration, price and vehicleType are required' 
      });
    }

    const service = await serviceRepo.create({
      name,
      description,
      duration,
      price,
      vehicleType,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

// Update service (admin only)
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const serviceRepo = new ServiceRepository(db);
    
    const service = await serviceRepo.update(req.params.id, req.body);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    next(error);
  }
});

// Delete service (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const serviceRepo = new ServiceRepository(db);

    // Verify service exists
    const existing = await serviceRepo.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Block deletion if there are reservations referencing this service
    const hasReservations = await serviceRepo.hasReservations(req.params.id);
    if (hasReservations) {
      return res.status(409).json({
        error: 'Cannot delete service',
        message: 'This service has associated reservations. Deactivate it instead of deleting it.'
      });
    }

    await serviceRepo.delete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
