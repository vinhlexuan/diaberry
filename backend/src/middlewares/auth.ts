import { Request, Response, NextFunction } from 'express';
import { getSessionService } from '../services/sessionService';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

export const authenticateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const sessionService = getSessionService();
    const { valid, user, session } = await sessionService.validateSession(token);

    if (!valid) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const sessionService = getSessionService();
      const { valid, user, session } = await sessionService.validateSession(token);
      if (valid) {
        req.user = user;
        req.session = session;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};