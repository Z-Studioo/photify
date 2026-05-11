import { Router } from 'express';
import {
  sendOrderStatusNotification,
  updateOrderStatus,
} from '@/controllers/orderStatusController';
import { cancelOrder } from '@/controllers/cancelOrderController';
import { updateVideoPermission } from '@/controllers/videoPermissionController';
import { adminAuth } from '@/middleware/adminAuth';

const router = Router();

/**
 * @swagger
 * /api/orders/{orderNumber}/status:
 *   patch:
 *     summary: Update an order status (admin)
 *     description: |
 *       Centralised status mutation. Validates the requested transition,
 *       writes an `order_status_history` audit row, and idempotently fires
 *       the customer notification email. Supports `allowRevert=true` to
 *       step backward in the linear flow without re-sending emails.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               reason: { type: string }
 *               allowRevert: { type: boolean }
 *     responses:
 *       200: { description: Status updated }
 *       400: { description: Invalid transition }
 *       404: { description: Order not found }
 *       409: { description: Concurrent update — refresh and retry }
 */
router.patch('/:orderNumber/status', adminAuth, updateOrderStatus);

/**
 * @swagger
 * /api/orders/{orderNumber}/status-notification:
 *   post:
 *     summary: Send order status change notification email
 *     description: Sends an email notification to the customer when order status changes (dispatched, delivered, cancelled)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The order number (e.g., PH-20260212-1234)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, shipped, delivered, cancelled]
 *                 description: New order status
 *           example:
 *             status: shipped
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               success: true
 *               message: Order dispatched notification sent
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to send notification
 */
router.post('/:orderNumber/status-notification', adminAuth, sendOrderStatusNotification);

/**
 * @swagger
 * /api/orders/{orderNumber}/cancel:
 *   post:
 *     summary: Cancel an order and issue refund
 *     description: Cancels an order, processes Stripe refund, and sends cancellation email to customer
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The order number (e.g., PH-20260212-1234)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *           example:
 *             reason: Customer requested cancellation
 *     responses:
 *       200:
 *         description: Order cancelled and refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or order cannot be cancelled
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to cancel order
 */
router.post('/:orderNumber/cancel', adminAuth, cancelOrder);

/**
 * @swagger
 * /api/orders/{orderId}/video-permission:
 *   patch:
 *     summary: Update filming consent for an order
 *     description: Stores the customer's yes/no consent to filming the making of their order. Called publicly from the confirmation page.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoPermission
 *             properties:
 *               videoPermission:
 *                 type: boolean
 *                 description: true if the customer consents, false otherwise
 *     responses:
 *       200:
 *         description: Consent updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 *       500:
 *         description: Failed to update consent
 */
router.patch('/:orderId/video-permission', updateVideoPermission);

export default router;
