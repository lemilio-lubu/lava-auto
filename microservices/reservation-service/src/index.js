/**
 * Reservation Service - Main Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('./database/db');
const serviceRoutes = require('./routes/service.routes');
const reservationRoutes = require('./routes/reservation.routes');
const ratingRoutes = require('./routes/rating.routes');
const jobRoutes = require('./routes/job.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');

const app = express();
const PORT = process.env.PORT || 4003;

// Initialize database
const db = new Database({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

app.set('db', db);

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'reservation-service',
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/jobs', jobRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`📅 Reservation Service running on port ${PORT}`);
});

module.exports = app;
