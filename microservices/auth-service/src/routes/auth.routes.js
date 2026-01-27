/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user.repository');
const { authMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register
router.post('/register', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if user exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userRepo.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'CLIENT'
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      isAvailable: user.is_available,
      rating: user.rating,
      completedServices: user.completed_services
    });
  } catch (error) {
    next(error);
  }
});

// Request password reset
router.post('/reset-password/request', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { email } = req.body;

    const user = await userRepo.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a reset link will be sent' });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await userRepo.setResetToken(user.id, resetToken, expiry);

    // In production, send email here
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If the email exists, a reset link will be sent' });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password/confirm', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const userRepo = new UserRepository(db);
    
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    const user = await userRepo.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userRepo.updatePassword(user.id, hashedPassword);
    await userRepo.clearResetToken(user.id);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', authMiddleware, async (req, res, next) => {
  try {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
