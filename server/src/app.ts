import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/config/environment';
import { swaggerSpec } from '@/config/swagger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import routes from '@/routes';
// import webhookRoutes from '@/routes/webhook';
import { handleStripeWebhook } from './controllers/webhookController';
import bodyParser from 'body-parser';
import { mountSSR } from './ssr';
import seoRoutes from '@/routes/seo';

const app = express();

// Security middleware. CSP is disabled because this server also serves
// SSR HTML that embeds inline `window.__INITIAL_DATA__` + JSON-LD scripts.
// Cross-origin policies are relaxed so Supabase + external image CDNs work.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting (API only \u2014 we don't want to throttle frontend HTML requests).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Webhook route MUST be mounted before JSON body parser
// Stripe webhooks require raw body for signature verification
// app.use('/api/webhook', webhookRoutes);
app.post(
  '/api/webhook',
  bodyParser.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Photify API Documentation',
}) as any);

// API routes
app.use('/api', routes);

// SEO endpoints (sitemap.xml, robots.txt) \u2014 mounted at root so that
// crawlers can discover them at the canonical `/sitemap.xml` path.
app.use('/', seoRoutes);

/**
 * Initialize the app asynchronously. SSR middleware (which boots Vite in
 * dev) must be registered AFTER API routes so that `/api/*` is still
 * handled by Express, and BEFORE the 404 / error handlers.
 *
 * The server entry (`index.ts`) must await this before calling listen().
 */
export async function initializeApp(): Promise<express.Express> {
  await mountSSR(app);

  // API-only 404 handler. SSR middleware always responds with HTML for
  // any other request (falling back to the SPA shell for unknown paths).
  app.use('/api', notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export { app };
