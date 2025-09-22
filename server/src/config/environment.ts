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
}

export const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  DB_URL: process.env.DB_URL,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables in production
if (config.NODE_ENV === 'production') {
  const requiredVars = ['JWT_SECRET'];
  const missing = requiredVars.filter(
    varName => !process.env[varName as keyof NodeJS.ProcessEnv]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}