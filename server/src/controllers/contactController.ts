import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendContactEmail, sendContactConfirmationEmail } from '@/lib/sendgrid';

export interface ContactRequestBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Validation rules for contact form
 */
export const contactValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
];

/**
 * POST /api/contact
 * Handle contact form submission
 */
export async function handleContactSubmission(
  req: Request<{}, {}, ContactRequestBody>,
  res: Response
): Promise<void> {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.type === 'field' ? err.path : undefined,
          message: err.msg,
        })),
      });
      return;
    }

    const { name, email, subject, message } = req.body;

    // Send emails
    try {
      // Send email to support team
      await sendContactEmail({ name, email, subject, message });

      // Send confirmation email to user (non-blocking)
      sendContactConfirmationEmail({ name, email, subject, message }).catch(
        err => {
          console.error('Failed to send confirmation email:', err);
        }
      );

      res.status(200).json({
        success: true,
        message:
          'Thank you for contacting us! We have received your message and will get back to you soon.',
        data: {
          name,
          email,
          subject,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (emailError: any) {
      console.error('Failed to send contact email:', emailError);

      res.status(500).json({
        error: 'Failed to send email',
        message:
          'We encountered an issue sending your message. Please try again or contact us directly at support@photify.co',
        details:
          process.env.NODE_ENV === 'development'
            ? emailError.message
            : undefined,
      });
      return;
    }
  } catch (error: any) {
    console.error('Contact form error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
