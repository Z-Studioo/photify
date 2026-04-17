import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  NODE_ENV: string;
  PORT: number;
  CLIENT_URL: string | undefined;
  JWT_SECRET: string | undefined;
  DB_URL: string | undefined;
  LOG_LEVEL: string;
  SUPABASE_URL: string | undefined;
  SUPABASE_SERVICE_KEY: string | undefined;
  SUPABASE_ANON_KEY: string | undefined;
  PUBLIC_APP_URL: string | undefined;
  STRIPE_SECRET_KEY: string | undefined;
  STRIPE_WEBHOOK_SECRET: string | undefined;
  OPENAI_API_KEY: string | undefined;
  SENDGRID_API_KEY: string | undefined;
  SENDGRID_FROM_EMAIL: string | undefined;
  SUPPORT_EMAIL: string | undefined;
  ADMIN_EMAIL: string | undefined;
}

export const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  DB_URL: process.env.DB_URL,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@photify.co',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
};

// Validate required environment variables in production
if (config.NODE_ENV === 'production') {
  const requiredVars = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  const missing = requiredVars.filter(
    varName => !process.env[varName as keyof NodeJS.ProcessEnv]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
