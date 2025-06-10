import { Repository } from "typeorm";
import { User } from "../entities/User";
import AppDataSource from "../config/database";

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    // Check if AppDataSource is initialized
    if (!AppDataSource.isInitialized) {
      throw new Error("Database not initialized. Call initializeDatabase() first.");
    }
    this.repository = AppDataSource.getRepository(User);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email: email.toLowerCase() });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.repository.findOneBy({ google_id: googleId });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async createOrUpdateGoogleUser(googleUserData: {
    email: string;
    google_id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }): Promise<User> {
    // First try to find by Google ID
    let user = await this.findByGoogleId(googleUserData.google_id);
    
    if (!user) {
      // If not found by Google ID, try by email
      user = await this.findByEmail(googleUserData.email);
    }

    if (user) {
      // Update existing user with Google data
      this.repository.merge(user, {
        ...googleUserData,
        provider: 'google'
      });
      return this.repository.save(user);
    } else {
      // Create new user
      return this.create({
        ...googleUserData,
        provider: 'google'
      });
    }
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    const user = await this.repository.findOneBy({ id });

    if (!user) {
      return null;
    }

    this.repository.merge(user, userData);
    return this.repository.save(user);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}

// Create a factory function instead of singleton
export const createUserRepository = () => {
  return new UserRepository();
};

// Export singleton but only after database is initialized
let userRepositoryInstance: UserRepository | null = null;

export const getUserRepository = (): UserRepository => {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
};