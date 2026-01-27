/**
 * API Gateway - Main Entry Point
 * Implements API Gateway Pattern
 * Routes requests to appropriate microservices
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authMiddleware } = require('./middleware/auth');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - DESACTIVADO para desarrollo
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
//   message: { error: 'Too many requests, please try again later' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  vehicles: process.env.VEHICLE_SERVICE_URL || 'http://localhost:4002',
  reservations: process.env.RESERVATION_SERVICE_URL || 'http://localhost:4003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005'
};

// Proxy options factory
const createProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(503).json({ error: 'Service temporarily unavailable' });
    },
    onProxyReq: (proxyReq, req) => {
      // Forward user info from JWT if available
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
      
      // Handle body for POST/PUT/PATCH
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  });
};

// Public routes (no auth required)
app.use('/api/auth', createProxy(services.auth, { '^/api/auth': '/api' }));

// Protected routes
app.use('/api/vehicles', authMiddleware, createProxy(services.vehicles, { '^/api/vehicles': '/api/vehicles' }));
app.use('/api/services', authMiddleware, createProxy(services.reservations, { '^/api/services': '/api/services' }));
app.use('/api/reservations', authMiddleware, createProxy(services.reservations, { '^/api/reservations': '/api/reservations' }));
app.use('/api/payments', authMiddleware, createProxy(services.payments, { '^/api/payments': '/api/payments' }));
app.use('/api/notifications', authMiddleware, createProxy(services.notifications, { '^/api/notifications': '/api/notifications' }));
app.use('/api/chat', authMiddleware, createProxy(services.notifications, { '^/api/chat': '/api/chat' }));

// Washer and admin routes
app.use('/api/washers', authMiddleware, createProxy(services.auth, { '^/api/washers': '/api/washers' }));
app.use('/api/users', authMiddleware, createProxy(services.auth, { '^/api/users': '/api/users' }));
app.use('/api/jobs', authMiddleware, createProxy(services.reservations, { '^/api/jobs': '/api/jobs' }));
app.use('/api/ratings', authMiddleware, createProxy(services.reservations, { '^/api/ratings': '/api/ratings' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log('📡 Routing to services:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`   - ${name}: ${url}`);
  });
});

module.exports = app;
