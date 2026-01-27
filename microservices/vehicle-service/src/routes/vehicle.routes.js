/**
 * Vehicle Routes
 */

const express = require('express');
const router = express.Router();
const VehicleRepository = require('../repositories/vehicle.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Internal endpoint - Get vehicle by ID (no auth, for service-to-service)
router.get('/internal/:id', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const vehicle = await vehicleRepo.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// Get all vehicles (admin only)
router.get('/all', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const { limit, offset } = req.query;
    const vehicles = await vehicleRepo.findAll({ 
      limit: parseInt(limit) || 100, 
      offset: parseInt(offset) || 0 
    });
    
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// Get user's vehicles
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const vehicles = await vehicleRepo.findByUserId(req.user.id);
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

// Get vehicle by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const vehicle = await vehicleRepo.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'ADMIN' && vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// Create vehicle
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const { brand, model, plate, vehicleType, color, year, ownerName, ownerPhone } = req.body;

    // Validate required fields
    if (!brand || !model || !plate || !vehicleType || !ownerName) {
      return res.status(400).json({ 
        error: 'Brand, model, plate, vehicleType and ownerName are required' 
      });
    }

    // Check if plate exists
    const existingVehicle = await vehicleRepo.findByPlate(plate);
    if (existingVehicle) {
      return res.status(409).json({ error: 'Vehicle with this plate already exists' });
    }

    const vehicle = await vehicleRepo.create({
      userId: req.user.id,
      brand,
      model,
      plate,
      vehicleType,
      color,
      year,
      ownerName,
      ownerPhone
    });

    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
});

// Update vehicle
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const vehicle = await vehicleRepo.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'ADMIN' && vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check plate uniqueness if changing
    if (req.body.plate && req.body.plate.toUpperCase() !== vehicle.plate) {
      const existingVehicle = await vehicleRepo.findByPlate(req.body.plate);
      if (existingVehicle) {
        return res.status(409).json({ error: 'Vehicle with this plate already exists' });
      }
    }

    const updatedVehicle = await vehicleRepo.update(req.params.id, req.body);
    res.json(updatedVehicle);
  } catch (error) {
    next(error);
  }
});

// Delete vehicle
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const vehicle = await vehicleRepo.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'ADMIN' && vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verificar si tiene reservas activas (PENDING, CONFIRMED, IN_PROGRESS)
    const reservationServiceUrl = process.env.RESERVATION_SERVICE_URL || 'http://reservation-service:4003';
    const internalUrl = `${reservationServiceUrl}/api/reservations/internal/by-vehicle/${req.params.id}`;
    console.log(`Checking reservations at: ${internalUrl}`);
    
    try {
      const response = await fetch(internalUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const reservations = await response.json();
        console.log(`Found ${reservations.length} reservations for vehicle`);
        
        const activeReservations = reservations.filter(r => 
          ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(r.status)
        );
        
        console.log(`Active reservations: ${activeReservations.length}`);
        
        if (activeReservations.length > 0) {
          return res.status(400).json({ 
            error: 'No se puede eliminar el vehículo porque tiene reservas activas',
            hasActiveReservations: true,
            activeCount: activeReservations.length
          });
        }
      } else {
        console.error(`Error response from reservation service: ${response.status}`);
        // Si no podemos verificar, no permitimos eliminar
        return res.status(503).json({ 
          error: 'No se pudo verificar las reservas. Intente de nuevo más tarde.',
          serviceUnavailable: true
        });
      }
    } catch (err) {
      console.error('Error conectando con reservation service:', err.message);
      // Si no podemos verificar, no permitimos eliminar
      return res.status(503).json({ 
        error: 'No se pudo verificar las reservas. Intente de nuevo más tarde.',
        serviceUnavailable: true
      });
    }

    await vehicleRepo.delete(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get vehicle count
router.get('/stats/count', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const vehicleRepo = new VehicleRepository(db);
    
    const count = await vehicleRepo.count(req.user.role === 'ADMIN' ? null : req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
