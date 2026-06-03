# Affiliate program email templates

These HTML files are **references**, not runtime assets. SendGrid renders the
real emails — the server just sends a template ID + dynamic data
(see `server/src/lib/sendgrid.ts`).

## Setup

For each `.html` file in this folder:

1. SendGrid dashboard → Email API → Dynamic Templates → **Create a Dynamic
   Template** (name it after the filename, e.g. `affiliate-approved`).
2. Create a new version → choose **Code Editor** → paste the file contents.
3. Open the **Settings** (gear icon, left sidebar) and set **Subject** to
   `{{{subject}}}` exactly. The server passes the real subject line in
   `dynamic_template_data.subject` (see `withTemplateSubject` in
   `server/src/lib/sendgrid.ts`). Without this, recipients see “(no subject)”.
4. Save. Copy the resulting `d-…` template ID.
5. Open `server/src/lib/sendgrid.ts` and replace the matching placeholder
   constant with the new ID:

   | File                                 | Constant to replace                      |
   | ------------------------------------ | ---------------------------------------- |
   | `affiliate-applied.html`             | `AFFILIATE_APPLIED_TEMPLATE`             |
   | `affiliate-approved.html`            | `AFFILIATE_APPROVED_TEMPLATE`            |
   | `affiliate-rejected.html`            | `AFFILIATE_REJECTED_TEMPLATE`            |
   | `affiliate-new-sale.html`            | `AFFILIATE_NEW_SALE_TEMPLATE`            |
   | `affiliate-commission-approved.html` | `AFFILIATE_COMMISSION_APPROVED_TEMPLATE` |
   | `affiliate-payout-sent.html`         | `AFFILIATE_PAYOUT_SENT_TEMPLATE`         |
   | `affiliate-password-reset.html`      | `AFFILIATE_PASSWORD_RESET_TEMPLATE`      |

## Dynamic variables sent by the backend

| Template            | Variables                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| all                 | `subject` (required for inbox subject line — set template Subject to `{{{subject}}}`)                                        |
| applied             | `name`, `support_url`                                                                                                        |
| approved            | `name`, `affiliate_code`, `customer_discount`, `commission_rate`, `referral_url`, `magic_link`, `dashboard_url`, `login_url` |
| rejected            | `name`, `reason`, `support_url`                                                                                              |
| new_sale            | `name`, `order_number`, `commission_amount`, `order_total`, `dashboard_url`                                                  |
| commission_approved | `name`, `order_number`, `commission_amount`, `dashboard_url`                                                                 |
| payout_sent         | `name`, `amount`, `method`, `reference`, `paid_at`, `dashboard_url`                                                          |
| password_reset      | `name`, `reset_link`, `login_url`, `support_url`                                                                             |

Variables not supplied by the server should be either omitted from the
template or wrapped in `{{#if …}}` blocks.
