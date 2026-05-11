import { Router } from 'express';
import {
  getShippingConfig,
  testShippingAuth,
  getQuotesForOrder,
  bookShipmentForOrder,
  getShipmentLabel,
  getShipmentTracking,
  syncOrderTracking,
} from '@/controllers/shippingController';
import { handleParcel2GoWebhook } from '@/controllers/parcel2goWebhookController';
import { adminAuth } from '@/middleware/adminAuth';

const router = Router();

/**
 * @swagger
 * /api/shipping/webhook:
 *   post:
 *     summary: Parcel2Go webhook receiver (no admin auth)
 *     description: |
 *       Public endpoint that Parcel2Go calls when subscribed events fire on
 *       your account. Authenticity is verified via HMAC-SHA256 signature
 *       computed from `Id:Timestamp(yyyy-MM-dd HH:mm:ss):Type` using the
 *       shared secret configured in My Account → API → Webhooks.
 *       Tracking-flavoured events automatically advance the order status:
 *       `DroppedOff` → shipped (+ dispatch email), `Delivered` → delivered
 *       (+ delivered email). Always returns 200 once verified.
 *     tags: [Shipping, Webhooks]
 *     responses:
 *       200: { description: Acknowledged }
 *       401: { description: Invalid signature }
 *       503: { description: Webhook secret not configured }
 */
router.post('/webhook', handleParcel2GoWebhook);

/**
 * @swagger
 * /api/shipping/config:
 *   get:
 *     summary: Check Parcel2Go integration status
 *     tags: [Shipping]
 *     responses:
 *       200: { description: Config status }
 */
router.get('/config', adminAuth, getShippingConfig);

/**
 * @swagger
 * /api/shipping/test-auth:
 *   get:
 *     summary: Test Parcel2Go OAuth + decode token claims
 *     tags: [Shipping]
 *     responses:
 *       200: { description: Token retrieved and decoded }
 *       401: { description: Auth failed }
 *       503: { description: Not configured }
 */
router.get('/test-auth', adminAuth, testShippingAuth);

/**
 * @swagger
 * /api/shipping/orders/{orderNumber}/quotes:
 *   post:
 *     summary: Get Parcel2Go quotes for an order
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of quotes }
 */
router.post('/orders/:orderNumber/quotes', adminAuth, getQuotesForOrder);

/**
 * @swagger
 * /api/shipping/orders/{orderNumber}/book:
 *   post:
 *     summary: Book a Parcel2Go shipment for an order
 *     tags: [Shipping]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Shipment booked }
 */
router.post('/orders/:orderNumber/book', adminAuth, bookShipmentForOrder);

/**
 * @swagger
 * /api/shipping/orders/{orderNumber}/label:
 *   get:
 *     summary: Stream the shipping label PDF
 *     tags: [Shipping]
 */
router.get('/orders/:orderNumber/label', adminAuth, getShipmentLabel);

/**
 * @swagger
 * /api/shipping/orders/{orderNumber}/tracking:
 *   get:
 *     summary: Get the current Parcel2Go tracking snapshot (read-only)
 *     tags: [Shipping]
 */
router.get('/orders/:orderNumber/tracking', adminAuth, getShipmentTracking);

/**
 * @swagger
 * /api/shipping/orders/{orderNumber}/sync-tracking:
 *   post:
 *     summary: Manually pull latest Parcel2Go tracking and apply any status transition
 *     description: |
 *       Drives the same status-transition pipeline as the webhook receiver
 *       and the polling cron. Useful when running in sandbox without
 *       webhooks, or to force a refresh from the admin UI.
 *     tags: [Shipping]
 */
router.post(
  '/orders/:orderNumber/sync-tracking',
  adminAuth,
  syncOrderTracking
);

export default router;
