/**
 * Auth Service - Main Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('./database/db');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const washerRoutes = require('./routes/washer.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');

const app = express();
const PORT = process.env.PORT || 4001;

// Initialize database
const db = new Database({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Make db available to routes
app.set('db', db);

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'auth-service',
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/washers', washerRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
});

module.exports = app;
