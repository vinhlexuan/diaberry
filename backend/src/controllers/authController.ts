import { Request, Response } from 'express';
import { getSessionService } from '../services/SessionService';

export const handleGoogleSignIn = (req: Request, res: Response): void => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const oauthURL = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173/callback`;
  res.redirect(oauthURL);
};

export const handleCallback = (req: Request, res: Response): void => {
  res.send("Callback received. Token handled by client.");
};

export const createUserFromGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, google_id, first_name, last_name, avatar_url } = req.body;
    
    if (!email || !google_id) {
      res.status(400).json({ error: 'Email and Google ID are required' });
      return;
    }

    console.log('🔄 Creating session for user:', { email, google_id });

    // Get request info
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Use factory pattern to get service instance
    const sessionService = getSessionService();
    const { user, session } = await sessionService.createSession(
      { email, google_id, first_name, last_name, avatar_url },
      { userAgent, ipAddress }
    );

    console.log('✅ Session created successfully:', { userId: user.id, sessionId: session.id });

    res.status(201).json({ 
      success: true,
      user: user.toJSON(),
      session: {
        token: session.token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('❌ Error creating user session:', error);
    res.status(500).json({ error: 'Failed to create user session' });
  }
};

export const validateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const sessionService = getSessionService();
    const { valid, user, session } = await sessionService.validateSession(token);

    if (!valid) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    res.json({
      success: true,
      user: user!.toJSON(),
      session: {
        token: session!.token,
        expires_at: session!.expires_at
      }
    });
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ error: 'Failed to validate session' });
  }
};

export const refreshSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const sessionService = getSessionService();
    const session = await sessionService.refreshSession(refresh_token);

    if (!session) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    res.json({
      success: true,
      session: {
        token: session.token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
};

export const signOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const sessionService = getSessionService();
    const success = await sessionService.invalidateSession(token);

    if (!success) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Session invalidated successfully'
    });
  } catch (error) {
    console.error('Error signing out:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  }
};