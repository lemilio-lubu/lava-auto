/**
 * Reservation Routes
 */

const express = require('express');
const router = express.Router();
const ReservationRepository = require('../repositories/reservation.repository');
const ServiceRepository = require('../repositories/service.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Internal endpoint for service-to-service calls (no auth required)
router.get('/internal/by-vehicle/:vehicleId', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const reservations = await reservationRepo.findByVehicleId(req.params.vehicleId);
    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

// Get user's reservations (or by vehicleId for service-to-service calls)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const { status, vehicleId } = req.query;
    
    // Si se pide por vehicleId (llamada desde otro servicio)
    if (vehicleId) {
      const reservations = await reservationRepo.findByVehicleId(vehicleId, { status });
      return res.json(reservations);
    }
    
    const reservations = await reservationRepo.findByUserId(req.user.id, { status });
    
    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

// Get all reservations (admin only)
router.get('/all', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const { status, limit, offset } = req.query;
    const reservations = await reservationRepo.findAll({ 
      status,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
    
    res.json(reservations);
  } catch (error) {
    next(error);
  }
});

// Get reservation stats
router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    let stats;
    if (req.user.role === 'ADMIN') {
      stats = await reservationRepo.getStats();
    } else if (req.user.role === 'WASHER') {
      stats = await reservationRepo.getStats(null, req.user.id);
    } else {
      stats = await reservationRepo.getStats(req.user.id);
    }
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get reservation by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && 
        reservation.userId !== req.user.id && 
        reservation.washerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

// Create reservation
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    const serviceRepo = new ServiceRepository(db);
    
    const { vehicleId, serviceId, scheduledDate, scheduledTime, notes, address, latitude, longitude } = req.body;

    // Validate required fields
    if (!vehicleId || !serviceId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ 
        error: 'vehicleId, serviceId, scheduledDate and scheduledTime are required' 
      });
    }

    // Get service to get price
    const service = await serviceRepo.findById(serviceId);
    if (!service) {
      return res.status(400).json({ error: 'Service not found' });
    }

    const reservation = await reservationRepo.create({
      userId: req.user.id,
      vehicleId,
      serviceId,
      scheduledDate,
      scheduledTime,
      totalAmount: service.price,
      notes,
      address,
      latitude,
      longitude
    });

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
});

// Update reservation (only PENDING can be edited)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    const serviceRepo = new ServiceRepository(db);
    
    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Solo se pueden editar reservas pendientes
    if (reservation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Solo se pueden editar reservas pendientes' });
    }

    const { vehicleId, serviceId, scheduledDate, scheduledTime, address, latitude, longitude, notes } = req.body;
    
    // Si cambia el servicio, actualizar el monto
    let totalAmount = reservation.totalAmount;
    if (serviceId && serviceId !== reservation.serviceId) {
      const service = await serviceRepo.findById(serviceId);
      if (service) {
        totalAmount = service.price;
      }
    }

    const updateData = {
      ...(vehicleId && { vehicleId }),
      ...(serviceId && { serviceId }),
      ...(scheduledDate && { scheduledDate }),
      ...(scheduledTime && { scheduledTime }),
      ...(address !== undefined && { address }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(notes !== undefined && { notes }),
      ...(totalAmount !== reservation.totalAmount && { totalAmount }),
    };

    const updatedReservation = await reservationRepo.update(req.params.id, updateData);
    res.json(updatedReservation);
  } catch (error) {
    next(error);
  }
});

// Assign washer to reservation (admin only)
router.post('/:id/assign', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const { washerId } = req.body;
    if (!washerId) {
      return res.status(400).json({ error: 'washerId is required' });
    }

    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Solo se puede asignar a reservas pendientes
    if (reservation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Solo se puede asignar washer a reservas pendientes' });
    }

    const updated = await reservationRepo.assignWasher(req.params.id, washerId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Cancel reservation
router.post('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Can only cancel pending or confirmed reservations
    if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Cannot cancel this reservation' });
    }

    const cancelled = await reservationRepo.cancelReservation(req.params.id);
    res.json(cancelled);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
