import { Router } from 'express';
import {
  handleContactSubmission,
  contactValidationRules,
} from '@/controllers/contactController';

const router = Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     description: Handle contact form submissions from users. Sends email to support team and confirmation to user via SendGrid.
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactRequest'
 *           example:
 *             name: John Doe
 *             email: john@example.com
 *             subject: Question about orders
 *             message: I would like to know more about tracking my order.
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactResponse'
 *             example:
 *               success: true
 *               message: Thank you for contacting us! We have received your message and will get back to you soon.
 *               data:
 *                 name: John Doe
 *                 email: john@example.com
 *                 subject: Question about orders
 *                 timestamp: "2026-02-05T10:30:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Validation failed
 *               details:
 *                 - field: email
 *                   message: Please provide a valid email address
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', contactValidationRules, handleContactSubmission);

export default router;
