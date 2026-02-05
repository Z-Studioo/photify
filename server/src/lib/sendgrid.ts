import sgMail from '@sendgrid/mail';
import { config } from '@/config/environment';

// Initialize SendGrid
if (config.SENDGRID_API_KEY) {
  sgMail.setApiKey(config.SENDGRID_API_KEY);
} else {
  console.warn('SendGrid API key not found. Email functionality will be disabled.');
}

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Send contact form email to support team
 */
export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  if (!config.SENDGRID_API_KEY) {
    throw new Error('SendGrid is not configured. Please set SENDGRID_API_KEY environment variable.');
  }

  const { name, email, subject, message } = data;

  // Email to support team
  const supportEmail = {
    to: config.SUPPORT_EMAIL || 'support@photify.co',
    from: config.SENDGRID_FROM_EMAIL || 'noreply@photify.co',
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form Submission</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f63a9e 0%, #e02d8d 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .field {
            margin-bottom: 20px;
          }
          .field-label {
            font-weight: 600;
            color: #f63a9e;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .field-value {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #f63a9e;
          }
          .message-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            border-left: 3px solid #f63a9e;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            border-radius: 0 0 10px 10px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .reply-button {
            display: inline-block;
            background: #f63a9e;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📬 New Contact Form Submission</h1>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="field-label">From</div>
            <div class="field-value">
              <strong>${name}</strong><br>
              <a href="mailto:${email}" style="color: #f63a9e; text-decoration: none;">${email}</a>
            </div>
          </div>
          
          <div class="field">
            <div class="field-label">Subject</div>
            <div class="field-value">${subject}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Message</div>
            <div class="message-box">${message}</div>
          </div>
          
          <div style="text-align: center;">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="reply-button">
              Reply to ${name}
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>This email was sent from the Photify contact form.</p>
          <p>Received at: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `,
    text: `
New Contact Form Submission

From: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

Reply to: ${email}
Received at: ${new Date().toLocaleString()}
    `,
  };

  // Send email
  await sgMail.send(supportEmail);
}

/**
 * Send confirmation email to the user
 */
export async function sendContactConfirmationEmail(data: ContactEmailData): Promise<void> {
  if (!config.SENDGRID_API_KEY) {
    return; // Silently fail for confirmation email
  }

  const { name, email, subject } = data;

  const confirmationEmail = {
    to: email,
    from: config.SENDGRID_FROM_EMAIL || 'noreply@photify.co',
    subject: 'We received your message - Photify',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Received</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f63a9e 0%, #e02d8d 100%);
            color: white;
            padding: 40px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .icon {
            font-size: 60px;
            margin-bottom: 10px;
          }
          .content {
            background: #ffffff;
            padding: 40px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .button {
            display: inline-block;
            background: #f63a9e;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
          }
          .info-box {
            background: #FFF5FB;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f63a9e;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="icon">✓</div>
          <h1>Thank You, ${name}!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">We've received your message</p>
        </div>
        
        <div class="content">
          <p>Hi ${name},</p>
          
          <p>Thank you for reaching out to Photify! We've successfully received your message regarding <strong>"${subject}"</strong>.</p>
          
          <div class="info-box">
            <p style="margin: 0;"><strong>📧 What happens next?</strong></p>
            <p style="margin: 10px 0 0 0;">Our support team will review your message and get back to you within 24 hours during business days. We're here to help!</p>
          </div>
          
          <p>In the meantime, feel free to explore:</p>
          <ul>
            <li><strong>Order Tracking:</strong> Track your existing orders</li>
            <li><strong>FAQ:</strong> Find quick answers to common questions</li>
            <li><strong>Product Gallery:</strong> Browse our latest collections</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${config.CLIENT_URL || 'https://photify.co'}" class="button">
              Visit Photify
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Photify</strong></p>
          <p>📧 ${config.SUPPORT_EMAIL || 'support@photify.co'} • 📱 +44 7585 630176</p>
          <p style="margin-top: 15px; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
Thank You, ${name}!

We've received your message regarding "${subject}".

Our support team will review your message and get back to you within 24 hours during business days.

In the meantime, visit us at ${config.CLIENT_URL || 'https://photify.co'}

Photify
${config.SUPPORT_EMAIL || 'support@photify.co'}
+44 7585 630176
    `,
  };

  try {
    await sgMail.send(confirmationEmail);
  } catch (error) {
    // Log error but don't throw - confirmation email is optional
    console.error('Failed to send confirmation email:', error);
  }
}

export { sgMail };
