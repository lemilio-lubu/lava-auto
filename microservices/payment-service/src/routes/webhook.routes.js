/**
 * Stripe Webhook Routes
 */

const express = require('express');
const router = express.Router();
const PaymentRepository = require('../repositories/payment.repository');

// Initialize Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', async (req, res) => {
  if (!stripe || !WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = req.app.get('db');
  const paymentRepo = new PaymentRepository(db);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await paymentRepo.updateByStripeIntent(paymentIntent.id, {
          status: 'COMPLETED',
          transactionId: paymentIntent.id
        });
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await paymentRepo.updateByStripeIntent(failedIntent.id, {
          status: 'FAILED',
          notes: failedIntent.last_payment_error?.message
        });
        console.log('Payment failed:', failedIntent.id);
        break;

      case 'charge.refunded':
        const refund = event.data.object;
        if (refund.payment_intent) {
          await paymentRepo.updateByStripeIntent(refund.payment_intent, {
            status: 'REFUNDED'
          });
        }
        console.log('Payment refunded:', refund.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
