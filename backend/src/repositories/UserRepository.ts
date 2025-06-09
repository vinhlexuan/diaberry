import { Repository } from "typeorm";
import { User } from "../entities/User";
import AppDataSource from "../config/database";

export class UserRepository {
	private repository: Repository<User>;

	constructor() {
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

	async create(userData: Partial<User>): Promise<User> {
		const user = this.repository.create(userData);
		return this.repository.save(user);
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
		return result.affected !== undefined && result.affected > 0;
	}
}

// Export a singleton instance
export const userRepository = new UserRepository();