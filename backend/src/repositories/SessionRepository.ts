import { Repository } from "typeorm";
import { Session } from "../entities/session";
import { User } from "../entities/user";
import AppDataSource from "../config/database";
import crypto from 'crypto';

export class SessionRepository {
  private repository: Repository<Session>;

  constructor() {
    if (!AppDataSource.isInitialized) {
      throw new Error("Database not initialized. Call initializeDatabase() first.");
    }
    this.repository = AppDataSource.getRepository(Session);
  }

  // Generate secure token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate refresh token
  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async create(sessionData: {
    userId: number;
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  }): Promise<Session> {
    const { userId, userAgent, ipAddress, expiresInDays = 7 } = sessionData;

    // Set expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const session = this.repository.create({
      token: this.generateToken(),
      user_id: userId,
      expires_at: expiresAt,
      refresh_token: this.generateRefreshToken(),
      user_agent: userAgent,
      ip_address: ipAddress,
      is_active: true
    });

    return this.repository.save(session);
  }

  async findByToken(token: string): Promise<Session | null> {
    return this.repository.findOne({
      where: { token, is_active: true },
      relations: ['user']
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    return this.repository.findOne({
      where: { refresh_token: refreshToken, is_active: true },
      relations: ['user']
    });
  }

  async findByUserId(userId: number): Promise<Session[]> {
    return this.repository.find({
      where: { user_id: userId, is_active: true },
      order: { created_at: 'DESC' }
    });
  }

  async refreshSession(refreshToken: string, expiresInDays: number = 7): Promise<Session | null> {
    const session = await this.findByRefreshToken(refreshToken);
    
    if (!session || !session.isValid()) {
      return null;
    }

    // Generate new tokens
    session.token = this.generateToken();
    session.refresh_token = this.generateRefreshToken();
    
    // Extend expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    session.expires_at = expiresAt;

    return this.repository.save(session);
  }

  async invalidateSession(token: string): Promise<boolean> {
    const result = await this.repository.update(
      { token }, 
      { is_active: false }
    );
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async invalidateAllUserSessions(userId: number): Promise<boolean> {
    const result = await this.repository.update(
      { user_id: userId }, 
      { is_active: false }
    );
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.repository.delete({
      expires_at: { $lt: new Date() } as any
    });
    return result.affected || 0;
  }

  async validateSession(token: string): Promise<{ valid: boolean; user?: User; session?: Session }> {
    const session = await this.findByToken(token);
    
    if (!session) {
      return { valid: false };
    }

    if (!session.isValid()) {
      // Invalidate expired session
      await this.invalidateSession(token);
      return { valid: false };
    }

    return { 
      valid: true, 
      user: session.user, 
      session 
    };
  }
}

// Singleton pattern
let sessionRepositoryInstance: SessionRepository | null = null;

export const getSessionRepository = (): SessionRepository => {
  if (!sessionRepositoryInstance) {
    sessionRepositoryInstance = new SessionRepository();
  }
  return sessionRepositoryInstance;
};