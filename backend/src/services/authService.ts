import { Request } from 'express';
import { getSessionService } from './sessionService';
import { User } from '../entities/user';
import { Session } from '../entities/session';

export interface AuthResult {
  user: User;
  session: Session;
}

export class AuthService {
  /**
   * Extract token from Authorization header
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.get('Authorization');
    return authHeader?.replace('Bearer ', '') || null;
  }

  /**
   * Authenticate request and return user/session if valid
   */
  async authenticateRequest(req: Request): Promise<AuthResult | null> {
    try {
      const token = this.extractToken(req);

      if (!token) {
        return null;
      }

      const sessionService = getSessionService();
      const { valid, user, session } = await sessionService.validateSession(token);

      if (!valid || !user || !session) {
        return null;
      }

      return { user, session };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Require authentication - throws error if not authenticated
   */
  async requireAuth(req: Request): Promise<AuthResult> {
    const auth = await this.authenticateRequest(req);
    if (!auth) {
      throw new Error('Authentication required');
    }
    return auth;
  }

  /**
   * Check if request has valid authentication
   */
  async isAuthenticated(req: Request): Promise<boolean> {
    const auth = await this.authenticateRequest(req);
    return auth !== null;
  }

  /**
   * Get user from request (returns null if not authenticated)
   */
  async getUser(req: Request): Promise<User | null> {
    const auth = await this.authenticateRequest(req);
    return auth?.user || null;
  }

  /**
   * Get session from request (returns null if not authenticated)
   */
  async getSession(req: Request): Promise<Session | null> {
    const auth = await this.authenticateRequest(req);
    return auth?.session || null;
  }
}

// Factory function
let authServiceInstance: AuthService | null = null;

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};