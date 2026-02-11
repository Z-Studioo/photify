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
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <title>New Contact Form Submission</title>
          <style type="text/css" rel="stylesheet" media="all">
          @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
          body { width: 100% !important; height: 100%; margin: 0; -webkit-text-size-adjust: none; font-family: "Nunito Sans", Helvetica, Arial, sans-serif; background-color: #F2F4F6; color: #51545E; }
          a { color: #F63A9E; }
          td { word-break: break-word; font-family: "Nunito Sans", Helvetica, Arial, sans-serif; font-size: 16px; }
          h1 { margin-top: 0; color: #333333; font-size: 22px; font-weight: bold; text-align: left; }
          p { margin: .4em 0 1.1875em; font-size: 16px; line-height: 1.625; color: #51545E; }
          .email-wrapper { width: 100%; margin: 0; padding: 0; background-color: #F2F4F6; }
          .email-content { width: 100%; margin: 0; padding: 0; }
          .email-masthead { padding: 25px 0; text-align: center; }
          .email-masthead_logo { width: 300px; }
          .email-body { width: 100%; margin: 0; padding: 0; }
          .email-body_inner { width: 570px; margin: 0 auto; padding: 0; background-color: #FFFFFF; }
          .email-footer { width: 570px; margin: 0 auto; padding: 0; text-align: center; }
          .email-footer p { color: #A8AAAF; }
          .content-cell { padding: 45px; }
          .attributes { margin: 0 0 21px; }
          .attributes_content { background-color: #F4F4F7; padding: 16px; }
          .attributes_item { padding: 8px 0; }
          .button { background-color: #F63A9E; border-top: 10px solid #F63A9E; border-right: 18px solid #F63A9E; border-bottom: 10px solid #F63A9E; border-left: 18px solid #F63A9E; display: inline-block; color: #FFF; text-decoration: none; border-radius: 3px; box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16); -webkit-text-size-adjust: none; box-sizing: border-box; }
          .body-action { width: 100%; margin: 30px auto; padding: 0; text-align: center; }
          .social { width: auto; }
          .social td { padding: 0; width: auto; }
          .social_icon { height: 20px; margin: 0 8px 10px 8px; padding: 0; }
          @media only screen and (max-width: 600px) {
            .email-body_inner, .email-footer { width: 100% !important; }
          }
          @media (prefers-color-scheme: dark) {
            body, .email-body, .email-body_inner, .email-content, .email-wrapper, .email-masthead, .email-footer { background-color: #333333 !important; color: #FFF !important; }
            p, a, h1, span, .attributes_item { color: #FFF !important; }
            .attributes_content { background-color: #222 !important; }
          }
          </style>
        </head>
        <body>
          <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center">
                <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="email-masthead">
                      <a href="https://photify.co">
                        <img src="https://5fa4a340f8c967ae9d08053cb424cc05.cdn.bubble.io/f1734091251381x155693691169358940/Frame%2012.png" alt="Photify Logo" class="email-masthead_logo" style="max-width: 150px; height: auto;">
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                      <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="content-cell">
                            <h1>📬 New Contact Form Submission</h1>
                            <p>You have received a new message from the Photify contact form.</p>
                            
                            <table class="attributes">
                              <tr>
                                <td class="attributes_content">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td class="attributes_item">
                                        <strong>From:</strong> ${name}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="attributes_item">
                                        <strong>Email:</strong> <a href="mailto:${email}" style="color: #F63A9E;">${email}</a>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="attributes_item">
                                        <strong>Subject:</strong> ${subject}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="attributes_item">
                                        <strong>Received:</strong> ${new Date().toLocaleString()}
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>

                            <h2>Message</h2>
                            <p style="white-space: pre-wrap; background-color: #F4F4F7; padding: 20px; border-radius: 4px;">${message}</p>

                            <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td align="center">
                                  <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="button" style="color: #ffffff;">Reply to ${name}</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="content-cell" align="center">
                            <p>Photify Limited<br>London, United Kingdom</p>
                            <table class="social" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td align="center">
                                  <table align="center" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td><a href="https://www.facebook.com/profile.php?id=61567498383981"><img src="https://img.icons8.com/fluency/24/facebook-new.png" alt="Facebook" class="social_icon" width="24" height="24" /></a></td>
                                      <td><a href="https://www.instagram.com/photify.co/"><img src="https://img.icons8.com/fluency/24/instagram-new.png" alt="Instagram" class="social_icon" width="24" height="24" /></a></td>
                                      <td><a href="https://www.tiktok.com/@photify.co"><img src="https://img.icons8.com/fluency/24/tiktok.png" alt="TikTok" class="social_icon" width="24" height="24" /></a></td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <title>Message Received - Photify</title>
          <style type="text/css" rel="stylesheet" media="all">
          @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
          body { width: 100% !important; height: 100%; margin: 0; -webkit-text-size-adjust: none; font-family: "Nunito Sans", Helvetica, Arial, sans-serif; background-color: #F2F4F6; color: #51545E; }
          a { color: #F63A9E; }
          td { word-break: break-word; font-family: "Nunito Sans", Helvetica, Arial, sans-serif; font-size: 16px; }
          h1 { margin-top: 0; color: #333333; font-size: 22px; font-weight: bold; text-align: left; }
          h3 { margin-top: 0; color: #333333; font-size: 14px; font-weight: bold; text-align: left; }
          p { margin: .4em 0 1.1875em; font-size: 16px; line-height: 1.625; color: #51545E; }
          p.sub { font-size: 13px; }
          ul { margin: .4em 0 1.1875em; font-size: 16px; line-height: 1.625; }
          .email-wrapper { width: 100%; margin: 0; padding: 0; background-color: #F2F4F6; }
          .email-content { width: 100%; margin: 0; padding: 0; }
          .email-masthead { padding: 25px 0; text-align: center; }
          .email-masthead_logo { width: 300px; }
          .email-body { width: 100%; margin: 0; padding: 0; }
          .email-body_inner { width: 570px; margin: 0 auto; padding: 0; background-color: #FFFFFF; }
          .email-footer { width: 570px; margin: 0 auto; padding: 0; text-align: center; }
          .email-footer p { color: #A8AAAF; }
          .content-cell { padding: 45px; }
          .attributes { margin: 0 0 21px; }
          .attributes_content { background-color: #F4F4F7; padding: 16px; border-radius: 4px; }
          .attributes_item { padding: 8px 0; }
          .button { background-color: #F63A9E; border-top: 10px solid #F63A9E; border-right: 18px solid #F63A9E; border-bottom: 10px solid #F63A9E; border-left: 18px solid #F63A9E; display: inline-block; color: #FFF; text-decoration: none; border-radius: 3px; box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16); -webkit-text-size-adjust: none; box-sizing: border-box; }
          .body-action { width: 100%; margin: 30px auto; padding: 0; text-align: center; }
          .body-sub { margin-top: 25px; padding-top: 25px; border-top: 1px solid #EAEAEC; }
          .social { width: auto; }
          .social td { padding: 0; width: auto; }
          .social_icon { height: 20px; margin: 0 8px 10px 8px; padding: 0; }
          @media only screen and (max-width: 600px) {
            .email-body_inner, .email-footer { width: 100% !important; }
            .button { width: 100% !important; text-align: center !important; }
          }
          @media (prefers-color-scheme: dark) {
            body, .email-body, .email-body_inner, .email-content, .email-wrapper, .email-masthead, .email-footer { background-color: #333333 !important; color: #FFF !important; }
            p, a, ul, h1, h3, span, .attributes_item { color: #FFF !important; }
            .attributes_content { background-color: #222 !important; }
          }
          </style>
        </head>
        <body>
          <span class="preheader">Thank you for contacting Photify. We've received your message and will respond soon.</span>
          <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center">
                <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="email-masthead">
                      <a href="https://photify.co">
                        <img src="https://5fa4a340f8c967ae9d08053cb424cc05.cdn.bubble.io/f1734091251381x155693691169358940/Frame%2012.png" alt="Photify Logo" class="email-masthead_logo" style="max-width: 150px; height: auto;">
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                      <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="content-cell">
                            <h1>Thank You for Contacting Us! 💬</h1>
                            <p>Hi ${name},</p>
                            <p>We've successfully received your message and wanted to let you know that we're on it! Our support team will review your inquiry and get back to you as soon as possible.</p>
                            
                            <table class="attributes">
                              <tr>
                                <td class="attributes_content">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td class="attributes_item">
                                        <strong>Your Message Subject:</strong> ${subject}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="attributes_item">
                                        <strong>Submitted:</strong> ${new Date().toLocaleString()}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="attributes_item">
                                        <strong>Response Time:</strong> Within 24 hours (business days)
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>

                            <h3>What happens next?</h3>
                            <p>Our support team will carefully review your message and respond to your email address: <strong>${email}</strong></p>
                            
                            <p>In the meantime, you can:</p>
                            <ul>
                              <li>Track your existing orders</li>
                              <li>Browse our product gallery</li>
                              <li>Explore our AI-powered photo tools</li>
                              <li>Check out our latest collections</li>
                            </ul>

                            <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td align="center">
                                  <a href="${config.CLIENT_URL || 'https://photify.co'}" class="button" style="color: #ffffff;">Visit Photify</a>
                                </td>
                              </tr>
                            </table>

                            <p>If you have any urgent questions, feel free to reach out to us directly at <a href="mailto:${config.SUPPORT_EMAIL || 'support@photify.co'}">${config.SUPPORT_EMAIL || 'support@photify.co'}</a></p>
                            
                            <p>Thanks for choosing Photify!<br>The Photify Team</p>

                            <table class="body-sub" role="presentation">
                              <tr>
                                <td>
                                  <p class="sub">This is an automated confirmation email. Please don't reply directly to this message.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td class="content-cell" align="center">
                            <p>Photify Limited<br>London, United Kingdom</p>
                            <table class="social" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td align="center">
                                  <table align="center" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td><a href="https://www.facebook.com/profile.php?id=61567498383981"><img src="https://img.icons8.com/fluency/24/facebook-new.png" alt="Facebook" class="social_icon" width="24" height="24" /></a></td>
                                      <td><a href="https://www.instagram.com/photify.co/"><img src="https://img.icons8.com/fluency/24/instagram-new.png" alt="Instagram" class="social_icon" width="24" height="24" /></a></td>
                                      <td><a href="https://www.tiktok.com/@photify.co"><img src="https://img.icons8.com/fluency/24/tiktok.png" alt="TikTok" class="social_icon" width="24" height="24" /></a></td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
