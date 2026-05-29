# Photify Server

A professional Node.js Express TypeScript server with comprehensive error handling, security middleware, and development tooling.

## 🚀 Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Express.js**: Fast, unopinionated web framework
- **Security**: Helmet, CORS, and rate limiting middleware
- **Error Handling**: Comprehensive error handling with custom error classes
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Development**: Hot reloading with Nodemon and TypeScript compilation
- **Logging**: Request logging and error tracking
- **Environment**: Environment variable validation and configuration

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── environment.ts      # Environment configuration
│   ├── middleware/
│   │   ├── errorHandler.ts     # Error handling middleware
│   │   └── requestLogger.ts    # Request logging middleware
│   ├── routes/
│   │   └── index.ts           # API routes
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── app.ts                 # Express app configuration
│   └── index.ts              # Server entry point
├── dist/                     # Compiled JavaScript output
├── .env.example             # Environment variables example
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── nodemon.json             # Nodemon configuration
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. **Navigate to server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Copy environment file:**

   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:3000
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-at-least-32-characters-long
   LOG_LEVEL=info
   ```

### Development

**Start development server:**

```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot reloading enabled.

### Production

**Build the project:**

```bash
npm run build
```

**Start production server:**

```bash
npm start
```

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run build:watch` - Build and watch for changes
- `npm run clean` - Remove dist directory
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Environment Variables

| Variable     | Description                | Default                 | Required         |
| ------------ | -------------------------- | ----------------------- | ---------------- |
| `NODE_ENV`   | Environment mode           | `development`           | No               |
| `PORT`       | Server port                | `5000`                  | No               |
| `CLIENT_URL` | Frontend URL for CORS      | `http://localhost:3000` | No               |
| `JWT_SECRET` | JWT secret key             | -                       | Yes (production) |
| `DB_URL`     | Database connection string | -                       | No               |
| `LOG_LEVEL`  | Logging level              | `info`                  | No               |

### Security Features

- **Helmet**: Sets various HTTP headers to secure the app
- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Request body size limits (10mb)
- **Error Handling**: Sanitized error responses in production

## 🛡️ Error Handling

The server includes comprehensive error handling with custom error classes:

- `AppError` - Base application error
- `ValidationError` - Input validation errors (400)
- `NotFoundError` - Resource not found errors (404)
- `UnauthorizedError` - Authentication errors (401)
- `ForbiddenError` - Authorization errors (403)
- `ConflictError` - Resource conflict errors (409)

### Example Usage

```typescript
import { NotFoundError, ValidationError } from '@/middleware/errorHandler';

// Throw custom errors
throw new NotFoundError('User not found');
throw new ValidationError('Invalid email format');
```

## 🚦 API Endpoints

### Health Check

- `GET /health` - Server health status
- `GET /api/health` - API health status
- `GET /api/` - API information

### Response Format

**Success Response:**

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "stack": "Stack trace (development only)"
  }
}
```

## 🧪 Development Best Practices

### Code Quality

- ESLint enforces consistent code style
- Prettier formats code automatically
- TypeScript provides type safety
- Strict TypeScript configuration enabled

### Error Handling

- Use custom error classes for different error types
- Always use `asyncHandler` for async route handlers
- Validate input data using express-validator
- Log errors appropriately

### Security

- Never expose sensitive data in error messages
- Use environment variables for configuration
- Implement proper authentication and authorization
- Keep dependencies updated

## 🔍 Monitoring and Logging

The server includes request logging middleware that tracks:

- HTTP method and URL
- Response status code
- Response time
- Content length
- Client IP address
- User agent

Log levels:

- `error` - Errors only
- `warn` - Warnings and errors
- `info` - General information, warnings, and errors
- `debug` - All requests and detailed information

## 🚀 Deployment

### Docker (Optional)

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure all required environment variables
3. Ensure JWT_SECRET is set and secure
4. Set up proper database connections
5. Configure reverse proxy (nginx) if needed

## 🤝 Affiliate Program

The affiliate program lets approved partners share a unique short link
(`/r/:code`) and earn commission on every paid order attributed to that link.
Implementation lives in `src/controllers/affiliate/`, `src/routes/affiliates.ts`,
and migration `supabase/migrations/004_affiliates.sql`.

### Roles

Authentication uses Supabase Auth with a `user_metadata.role` claim:

- `admin` — full access to the admin dashboard and admin affiliate endpoints.
- `affiliate` — access to the affiliate dashboard and self-service endpoints
  only.

Existing admins created before the role model was introduced need to be
stamped once with `role: 'admin'`. Run the one-off backfill script:

```bash
cd server
node scripts/backfill-admin-role.js
```

New affiliate accounts are stamped with `role: 'affiliate'` automatically by
the admin approval flow (which also issues a Supabase magic-link invite).

### Lifecycle

1. **Apply** — `POST /api/affiliates/apply` creates an `affiliates` row with
   `status='pending'`. Confirmation email goes to the applicant; notification
   to `ADMIN_EMAIL`.
2. **Approve** — `POST /api/affiliates/:id/approve` (admin only) generates a
   unique referral code, mints a matching `promotions` row (auto-applied
   discount), issues a Supabase magic-link invite (`/affiliate/set-password`),
   and emails the affiliate with their dashboard URL.
3. **Refer** — visitors landing on `/r/:code` get a 30-day localStorage cookie
   and a fire-and-forget click ping
   (`POST /api/affiliates/track-click`, aggregated by day).
4. **Order** — checkout sends `affiliateCode` to `/api/payment-intent` (or
   `/api/checkout`); the server resolves it to `affiliate_id` and stamps the
   `orders` row. The Stripe webhook (`payment_intent.succeeded` /
   `checkout.session.completed`) idempotently inserts an
   `affiliate_commissions` row (`status='pending'`) and emails the affiliate.
5. **Deliver** — when the admin flips `orders.status` to `delivered`, a DB
   trigger sets `affiliate_commissions.available_at = now() + holding_days`
   (default 14).
6. **Approve commissions** — `POST /api/affiliates/admin/run-commission-approval`
   runs a debounced (15min) set-based RPC (`approve_due_commissions`) that
   flips `pending` → `approved` and emails affected affiliates. The admin
   layout fires this in the background on every admin page load.
7. **Pay out** — admin records a payout via
   `POST /api/affiliates/:id/payouts`. Eligible approved commissions are
   marked `paid` and the affiliate is emailed.
8. **Refund** — Stripe `charge.refunded` reverses the linked commission
   (`pending`/`approved` → `reversed`).

### Email templates

All 7 affiliate emails go through SendGrid dynamic templates. Template IDs
are inline `const` strings in `src/lib/sendgrid.ts` (see
`server/email-templates/affiliates/README.md`). Upload each HTML reference,
set the template Subject to `{{{subject}}}`, then paste the `d-…` ID into
`sendgrid.ts`.

**Forgot password** — `POST /api/affiliates/forgot-password` emails approved
affiliates a recovery link via SendGrid (`affiliate-password-reset.html`).
Reset links redirect to `{CLIENT_URL}/affiliate/set-password` (add this URL
under Supabase → Authentication → URL configuration → Redirect URLs).

### Environment variables

No new environment variables are required. The affiliate flow reuses:

- `CLIENT_URL` — used to construct dashboard, magic-link / password-reset
  redirects, and referral URLs.
- `ADMIN_EMAIL` — receives the "new affiliate application" notification.
- `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` — drive all email sends.
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` — power admin user invites and
  bypass RLS for commission writes from the webhook.

### Database

Schema lives in `supabase/migrations/004_affiliates.sql` and introduces:

- `affiliates`, `affiliate_commissions`, `affiliate_payouts`,
  `affiliate_referrals_daily`, `system_jobs`
- Columns `orders.affiliate_id`, `orders.affiliate_code`
- RLS policies (`is_admin()` / `is_affiliate()` helpers)
- RPCs `get_affiliate_stats`, `approve_due_commissions`,
  `increment_affiliate_click`
- Trigger `trg_set_commission_available_at` on `orders`

Apply via the Supabase MCP, CLI (`supabase db push`), or by running the SQL
manually in the Supabase SQL editor.

## 📝 Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed
5. Run linting and formatting before committing

## 📄 License

MIT License - see LICENSE file for details
