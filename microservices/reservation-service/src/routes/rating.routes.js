/**
 * Rating Routes
 */

const express = require('express');
const router = express.Router();
const RatingRepository = require('../repositories/rating.repository');
const ReservationRepository = require('../repositories/reservation.repository');
const { authMiddleware } = require('../middleware/auth');

// Get ratings for a washer
router.get('/washer/:washerId', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const ratingRepo = new RatingRepository(db);
    
    const ratings = await ratingRepo.findByWasherId(req.params.washerId);
    const average = await ratingRepo.getAverageRating(req.params.washerId);
    
    res.json({
      ratings,
      ...average
    });
  } catch (error) {
    next(error);
  }
});

// Get rating for a reservation
router.get('/reservation/:reservationId', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const ratingRepo = new RatingRepository(db);
    
    const rating = await ratingRepo.findByReservationId(req.params.reservationId);
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    
    res.json(rating);
  } catch (error) {
    next(error);
  }
});

// Create rating
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const ratingRepo = new RatingRepository(db);
    const reservationRepo = new ReservationRepository(db);
    
    const { reservationId, stars, comment } = req.body;

    if (!reservationId || !stars) {
      return res.status(400).json({ error: 'reservationId and stars are required' });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }

    // Get reservation
    const reservation = await reservationRepo.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if user owns the reservation
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if reservation is completed
    if (reservation.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only rate completed reservations' });
    }

    // Check if already rated
    const existingRating = await ratingRepo.findByReservationId(reservationId);
    if (existingRating) {
      return res.status(409).json({ error: 'Reservation already rated' });
    }

    const rating = await ratingRepo.create({
      reservationId,
      userId: req.user.id,
      washerId: reservation.washerId,
      stars,
      comment
    });

    res.status(201).json(rating);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
