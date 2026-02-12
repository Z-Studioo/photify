import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/environment';

/**
 * Admin authentication middleware
 * Verifies the Supabase JWT token from the Authorization header
 */
export async function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization token is required',
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_KEY) {
    console.error('Supabase configuration is missing');
    res.status(500).json({
      error: 'Server configuration error',
      message: 'Authentication service is not properly configured',
    });
    return;
  }

  try {
    // Create Supabase client with service key for verification
    const supabase = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Token is valid and user is authenticated
    // You can add additional role checks here if needed
    // For example: check if user has admin role in your users table

    // Attach user to request for use in route handlers
    (req as any).user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}
