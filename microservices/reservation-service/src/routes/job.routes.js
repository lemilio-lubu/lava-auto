/**
 * Job Routes (for washers)
 */

const express = require('express');
const router = express.Router();
const ReservationRepository = require('../repositories/reservation.repository');
const ServiceRepository = require('../repositories/service.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Helper function to fetch vehicle data from vehicle-service
async function fetchVehicleData(vehicleId) {
  try {
    const vehicleServiceUrl = process.env.VEHICLE_SERVICE_URL || 'http://vehicle-service:4002';
    const response = await fetch(`${vehicleServiceUrl}/api/vehicles/internal/${vehicleId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching vehicle:', error.message);
  }
  return null;
}

// Helper to enrich jobs with vehicle and service data
async function enrichJobsWithDetails(jobs, db) {
  const serviceRepo = new ServiceRepository(db);
  
  const enrichedJobs = await Promise.all(jobs.map(async (job) => {
    // Fetch vehicle from vehicle-service
    const vehicle = await fetchVehicleData(job.vehicleId);
    
    // Fetch full service data
    const service = await serviceRepo.findById(job.serviceId);
    
    return {
      ...job,
      vehicle: vehicle || null,
      service: service || { 
        id: job.serviceId, 
        name: job.serviceName, 
        duration: job.serviceDuration 
      }
    };
  }));
  
  return enrichedJobs;
}

// Get available jobs (pending reservations without washer)
router.get('/available', authMiddleware, roleMiddleware('WASHER', 'ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const jobs = await reservationRepo.findPendingJobs();
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// Get washer's assigned jobs
router.get('/my-jobs', authMiddleware, roleMiddleware('WASHER'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const { status } = req.query;
    const jobs = await reservationRepo.findByWasherId(req.user.id, { status });
    
    // Enrich jobs with vehicle and service details
    const enrichedJobs = await enrichJobsWithDetails(jobs, db);
    
    res.json(enrichedJobs);
  } catch (error) {
    next(error);
  }
});

// Accept job (assign washer)
router.post('/:id/accept', authMiddleware, roleMiddleware('WASHER'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (reservation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Job is no longer available' });
    }

    if (reservation.washerId) {
      return res.status(400).json({ error: 'Job already assigned' });
    }

    const updated = await reservationRepo.assignWasher(req.params.id, req.user.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Start service
router.post('/:id/start', authMiddleware, roleMiddleware('WASHER'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (reservation.washerId !== req.user.id) {
      return res.status(403).json({ error: 'Not your job' });
    }

    if (reservation.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Job must be confirmed to start' });
    }

    const updated = await reservationRepo.startService(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Complete service
router.post('/:id/complete', authMiddleware, roleMiddleware('WASHER'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (reservation.washerId !== req.user.id) {
      return res.status(403).json({ error: 'Not your job' });
    }

    if (reservation.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Job must be in progress to complete' });
    }

    const updated = await reservationRepo.completeService(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Update estimated arrival
router.put('/:id/eta', authMiddleware, roleMiddleware('WASHER'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const reservationRepo = new ReservationRepository(db);
    
    const { estimatedArrival } = req.body;
    if (!estimatedArrival) {
      return res.status(400).json({ error: 'estimatedArrival is required' });
    }

    const reservation = await reservationRepo.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (reservation.washerId !== req.user.id) {
      return res.status(403).json({ error: 'Not your job' });
    }

    const updated = await reservationRepo.update(req.params.id, { estimatedArrival });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
