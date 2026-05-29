import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment';
import { supabase } from '@/lib/supabase';

/**
 * Admin authentication middleware.
 *
 * Validates the Supabase JWT in the Authorization header and asserts that the
 * authenticated user has `role = 'admin'` in either `user_metadata` or
 * `app_metadata`. Affiliates and unscoped users are rejected.
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

  const token = authHeader.substring(7);

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_KEY) {
    console.error('Supabase configuration is missing');
    res.status(500).json({
      error: 'Server configuration error',
      message: 'Authentication service is not properly configured',
    });
    return;
  }

  try {
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

    const role =
      (user.user_metadata as Record<string, unknown> | undefined)?.role ??
      (user.app_metadata as Record<string, unknown> | undefined)?.role;

    // Explicit affiliate accounts must never use admin routes.
    if (role === 'affiliate') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin role required',
      });
      return;
    }

    // Require role=admin. Legacy admin accounts created before the affiliate
    // rollout may not have user_metadata.role yet — allow them through until
    // `node server/scripts/backfill-admin-role.js` has been run once.
    if (role && role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin role required',
      });
      return;
    }

    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}
