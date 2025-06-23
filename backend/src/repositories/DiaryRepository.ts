import { Repository, Between } from "typeorm";
import { Diary } from "../entities/diary";
import { User } from "../entities/user";
import AppDataSource from "../config/database";

export class DiaryRepository {
  private repository: Repository<Diary>;

  constructor() {
    if (!AppDataSource.isInitialized) {
      throw new Error("Database not initialized. Call initializeDatabase() first.");
    }
    this.repository = AppDataSource.getRepository(Diary);
  }

  async findAll(): Promise<Diary[]> {
    return this.repository.find({
      relations: ['user']
    });
  }

  async findById(id: number): Promise<Diary | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['user']
    });
  }

  async findByUserId(userId: number): Promise<Diary[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { date: 'DESC' }
    });
  }

  async findByUserIdAndDate(userId: number, date: Date): Promise<Diary | null> {
    // Get start and end of the day for the given date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.findOne({
      where: {
        user: { id: userId },
        date: Between(startOfDay, endOfDay)
      },
      relations: ['user']
    });
  }

  async create(diaryData: {
    date: Date;
    content: string;
    userId: number;
  }): Promise<Diary> {
    const diary = this.repository.create({
      date: diaryData.date,
      content: diaryData.content,
      user: { id: diaryData.userId } as User
    });
    return this.repository.save(diary);
  }

  async update(id: number, diaryData: Partial<{
    date: Date;
    content: string;
  }>): Promise<Diary | null> {
    const diary = await this.repository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!diary) {
      return null;
    }

    this.repository.merge(diary, diaryData);
    return this.repository.save(diary);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async deleteByUserId(userId: number): Promise<boolean> {
    const result = await this.repository.delete({ user: { id: userId } });
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}

// Singleton pattern
let diaryRepositoryInstance: DiaryRepository | null = null;

export const getDiaryRepository = (): DiaryRepository => {
  if (!diaryRepositoryInstance) {
    diaryRepositoryInstance = new DiaryRepository();
  }
  return diaryRepositoryInstance;
};