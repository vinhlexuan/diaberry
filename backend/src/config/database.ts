import { DataSource } from "typeorm";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Entities
import { User } from "../entities/User";
import { Diary } from "../entities/Diary";
import { DiaryShare } from "../entities/DiaryShare";

const AppDataSource = new DataSource({
	type: "postgres",
	url: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	},
	schema: "diaberry",
	synchronize: false, // Set to true for development only
	logging: process.env.NODE_ENV !== 'production',
	entities: [User, Diary, DiaryShare],
	migrations: [path.join(__dirname, "../migrations/*.{js,ts}")],
	subscribers: [path.join(__dirname, "../subscribers/*.{js,ts}")],
});

// Initialize the data source
export const initializeDatabase = async () => {
	try {
		await AppDataSource.initialize();
		console.log("Database connection initialized");
	} catch (error) {
		console.error("Error initializing database connection:", error);
		throw error;
	}
};

export default AppDataSource;