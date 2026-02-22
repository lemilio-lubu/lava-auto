/**
 * API Gateway Routes Configuration
 */

const routes = {
  // Auth service routes
  auth: {
    prefix: '/api/auth',
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    public: true
  },
  
  // Vehicle service routes
  vehicles: {
    prefix: '/api/vehicles',
    target: process.env.VEHICLE_SERVICE_URL || 'http://localhost:4002',
    public: false
  },
  
  // Reservation service routes
  reservations: {
    prefix: '/api/reservations',
    target: process.env.RESERVATION_SERVICE_URL || 'http://localhost:4003',
    public: false
  },
  
  // Services (part of reservation service)
  services: {
    prefix: '/api/services',
    target: process.env.RESERVATION_SERVICE_URL || 'http://localhost:4003',
    public: false
  },
  
  // Payment service routes
  payments: {
    prefix: '/api/payments',
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004',
    public: false
  },
  
  // Notification service routes
  notifications: {
    prefix: '/api/notifications',
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
    public: false
  },
  
  // Chat (part of notification service)
  chat: {
    prefix: '/api/chat',
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
    public: false
  }
};

module.exports = routes;
