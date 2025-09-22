import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log request start
  if (config.LOG_LEVEL === 'debug') {
    console.log(`→ ${method} ${url} - ${ip} - ${userAgent}`);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('Content-Length') || 0;

    const logLevel = statusCode >= 400 ? 'error' : 'info';
    const logMessage = `← ${method} ${url} - ${statusCode} - ${duration}ms - ${contentLength}b - ${ip}`;

    if (
      config.LOG_LEVEL === 'debug' ||
      (config.LOG_LEVEL === 'info' && logLevel === 'info') ||
      logLevel === 'error'
    ) {
      console.log(logMessage);
    }
  });

  next();
};
