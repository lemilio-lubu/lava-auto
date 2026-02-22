'use strict';

/**
 * webhook.routes.js — Receptor del webhook de Stripe.
 *
 * IMPORTANTE: este router necesita el cuerpo RAW (sin parse JSON).
 * En index.js se monta ANTES de express.json() con:
 *
 *   app.use(
 *     '/api/payments/webhook',
 *     express.raw({ type: 'application/json' }),
 *     webhookRoutes
 *   );
 *
 * Eventos manejados:
 *   - payment_intent.succeeded   → COMPLETED
 *   - payment_intent.payment_failed → FAILED
 *   - charge.refunded            → REFUNDED
 */

const express           = require('express');
const PaymentRepository = require('./payment.repository');

const router = express.Router();

// Stripe se inicializa solo si la clave es real (no el placeholder de dev)
const _stripeKey = process.env.STRIPE_SECRET_KEY;
const _isRealKey = _stripeKey &&
  _stripeKey !== 'sk_test_placeholder' &&
  _stripeKey !== 'sk_live_placeholder' &&
  _stripeKey.length > 30;

const stripe = _isRealKey ? require('stripe')(_stripeKey) : null;

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || null;

// POST /api/payments/webhook
router.post('/', async (req, res) => {
  // Si Stripe no está configurado devolvemos 200 para evitar reintentos
  if (!stripe || !WEBHOOK_SECRET) {
    console.warn('[webhook] Stripe no configurado — webhook ignorado.');
    return res.json({ received: true, warning: 'stripe_not_configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Firma inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const repo = new PaymentRepository(req.db);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        await repo.updateByStripeIntent(pi.id, {
          status:        'COMPLETED',
          transactionId: pi.id,
        });
        console.log(`[webhook] Pago completado: ${pi.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        await repo.updateByStripeIntent(pi.id, {
          status: 'FAILED',
          notes:  pi.last_payment_error?.message ?? 'Stripe payment failed',
        });
        console.log(`[webhook] Pago fallido: ${pi.id}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        if (charge.payment_intent) {
          await repo.updateByStripeIntent(charge.payment_intent, {
            status: 'REFUNDED',
          });
          console.log(`[webhook] Pago reembolsado: ${charge.payment_intent}`);
        }
        break;
      }

      default:
        // No fallar por eventos desconocidos — Stripe puede enviar muchos
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[webhook] Error procesando evento:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
