import { Request, Response, NextFunction } from 'express';
import { getAuthService, AuthResult } from '../services/authService';

// Store auth results in a WeakMap to avoid extending Request
const authResults = new WeakMap<Request, AuthResult>();

/**
 * Get authentication result for a request
 */
export const getAuthFromRequest = (req: Request): AuthResult | null => {
  return authResults.get(req) || null;
};

/**
 * Middleware that requires authentication
 */
export const authenticateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authService = getAuthService();
    const auth = await authService.authenticateRequest(req);

    if (!auth) {
      console.log('❌ Authentication failed for:', req.method, req.path);
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Store auth result in WeakMap
    authResults.set(req, auth);
    
    console.log('✅ User authenticated:', auth.user.id, auth.user.email);
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authService = getAuthService();
    const auth = await authService.authenticateRequest(req);

    if (auth) {
      // Store auth result in WeakMap if authentication succeeded
      authResults.set(req, auth);
      console.log('✅ Optional auth - User authenticated:', auth.user.id);
    } else {
      console.log('ℹ️ Optional auth - No valid authentication');
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Helper function to require auth in controllers
 */
export const requireAuthFromRequest = (req: Request): AuthResult => {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    throw new Error('Authentication required');
  }
  return auth;
};