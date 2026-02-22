/**
 * Auth Middleware for Payment Service
 */

function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const userEmail = req.headers['x-user-email'];

  if (!userId || !userRole) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  req.user = { id: userId, role: userRole, email: userEmail };
  next();
}

function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
