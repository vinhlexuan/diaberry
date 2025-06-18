import { getSessionRepository } from '../repositories/SessionRepository';
import { getUserRepository } from '../repositories/UserRepository';
import { Session } from '../entities/Session';
import { User } from '../entities/User';

export class SessionService {
  async createSession(userData: {
    email: string;
    google_id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }, requestInfo: {
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ user: User; session: Session }> {
    // Get repository instances using factory pattern
    const sessionRepository = getSessionRepository();
    const userRepository = getUserRepository();

    // Create or update user
    let user = await userRepository.findByGoogleId(userData.google_id);
    
    if (!user) {
      user = await userRepository.findByEmail(userData.email);
    }

    if (user) {
      // Update existing user
      const updatedUser = await userRepository.update(user.id, {
        ...userData,
        provider: 'google'
      });
      user = updatedUser!;
    } else {
      // Create new user
      user = await userRepository.create({
        ...userData,
        provider: 'google'
      });
    }

    // Create session
    const session = await sessionRepository.create({
      userId: user.id,
      userAgent: requestInfo.userAgent,
      ipAddress: requestInfo.ipAddress
    });

    return { user, session };
  }

  async validateSession(token: string): Promise<{ valid: boolean; user?: User; session?: Session }> {
    const sessionRepository = getSessionRepository();
    return sessionRepository.validateSession(token);
  }

  async refreshSession(refreshToken: string): Promise<Session | null> {
    const sessionRepository = getSessionRepository();
    return sessionRepository.refreshSession(refreshToken);
  }

  async invalidateSession(token: string): Promise<boolean> {
    const sessionRepository = getSessionRepository();
    return sessionRepository.invalidateSession(token);
  }

  async invalidateAllUserSessions(userId: number): Promise<boolean> {
    const sessionRepository = getSessionRepository();
    return sessionRepository.invalidateAllUserSessions(userId);
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    const sessionRepository = getSessionRepository();
    return sessionRepository.findByUserId(userId);
  }

  // Cleanup expired sessions (can be run as a cron job)
  async cleanupExpiredSessions(): Promise<number> {
    const sessionRepository = getSessionRepository();
    return sessionRepository.cleanupExpiredSessions();
  }
}

// Use factory pattern for SessionService as well
let sessionServiceInstance: SessionService | null = null;

export const getSessionService = (): SessionService => {
  if (!sessionServiceInstance) {
    sessionServiceInstance = new SessionService();
  }
  return sessionServiceInstance;
};

// Also export singleton instance for backward compatibility
export const sessionService = getSessionService();