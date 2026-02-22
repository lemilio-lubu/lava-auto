/**
 * Payment Routes
 */

const express = require('express');
const router = express.Router();
const PaymentRepository = require('../repositories/payment.repository');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Initialize Stripe (optional, graceful fallback if no key)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Get user's payments
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const payments = await paymentRepo.findByUserId(req.user.id);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Get all payments (admin only)
router.get('/all', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const { status, limit, offset } = req.query;
    const payments = await paymentRepo.findAll({
      status,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });
    
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Get payment stats (admin only)
router.get('/stats', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const stats = await paymentRepo.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get payments for a reservation
router.get('/reservation/:reservationId', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const payments = await paymentRepo.findByReservationId(req.params.reservationId);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Get payment by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const payment = await paymentRepo.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && payment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
});

// Create payment (cash payment)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const { reservationId, amount, paymentMethod, notes } = req.body;

    if (!reservationId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'reservationId, amount and paymentMethod are required' 
      });
    }

    const payment = await paymentRepo.create({
      reservationId,
      userId: req.user.id,
      amount,
      paymentMethod,
      status: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING',
      notes
    });

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

// Create Stripe payment intent (with mock fallback)
router.post('/create-intent', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const { reservationId, amount } = req.body;

    if (!reservationId || !amount) {
      return res.status(400).json({ error: 'reservationId and amount are required' });
    }

    let paymentIntentId;
    let clientSecret;

    if (stripe) {
      // Real Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: 'usd',
        metadata: {
          reservationId,
          userId: req.user.id
        }
      });
      paymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
    } else {
      // Mock payment intent (for development without Stripe keys)
      paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      clientSecret = `${paymentIntentId}_secret_mock`;
    }

    // Create payment record
    const payment = await paymentRepo.create({
      reservationId,
      userId: req.user.id,
      amount,
      paymentMethod: 'CARD',
      stripePaymentIntent: paymentIntentId
    });

    res.json({
      clientSecret,
      paymentId: payment.id,
      isMock: !stripe // Indicate if this is a mock payment
    });
  } catch (error) {
    next(error);
  }
});

// Confirm mock payment (for development without real Stripe)
router.post('/mock-confirm', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const { paymentId, cardNumber, cardExpiry, cardCvc, cardName } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }

    const payment = await paymentRepo.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // Simulate card validation (mock - always succeeds for valid format)
    const isValidCard = cardNumber && cardNumber.replace(/\s/g, '').length >= 13;
    const isValidExpiry = cardExpiry && /^\d{2}\/\d{2}$/.test(cardExpiry);
    const isValidCvc = cardCvc && /^\d{3,4}$/.test(cardCvc);

    if (!isValidCard || !isValidExpiry || !isValidCvc) {
      // Simulate payment failure for invalid card data
      await paymentRepo.update(paymentId, { 
        status: 'FAILED',
        notes: 'Invalid card information (mock)'
      });
      return res.status(400).json({ 
        error: 'Invalid card information',
        details: {
          card: !isValidCard ? 'Invalid card number' : null,
          expiry: !isValidExpiry ? 'Invalid expiry date (use MM/YY)' : null,
          cvc: !isValidCvc ? 'Invalid CVC' : null
        }
      });
    }

    // Simulate successful payment
    const updated = await paymentRepo.update(paymentId, { 
      status: 'COMPLETED',
      transactionId: `mock_txn_${Date.now()}`
    });

    res.json({
      success: true,
      payment: updated,
      message: 'Pago procesado exitosamente (modo demo)'
    });
  } catch (error) {
    next(error);
  }
});

// Confirm cash payment (washer/admin)
router.post('/:id/confirm', authMiddleware, roleMiddleware('WASHER', 'ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const payment = await paymentRepo.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment is not pending' });
    }

    const updated = await paymentRepo.update(req.params.id, { 
      status: 'COMPLETED',
      transactionId: `cash_${Date.now()}`
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Refund payment (admin only)
router.post('/:id/refund', authMiddleware, roleMiddleware('ADMIN'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const paymentRepo = new PaymentRepository(db);
    
    const payment = await paymentRepo.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    // If Stripe payment, refund through Stripe
    if (stripe && payment.stripePaymentIntent) {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntent
      });
    }

    const updated = await paymentRepo.update(req.params.id, { status: 'REFUNDED' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
