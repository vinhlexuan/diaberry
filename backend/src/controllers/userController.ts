import { Request, Response } from 'express';
import { getUserRepository } from '../repositories/UserRepository';

/**
 * Get all users
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
	try {
		const userRepository = getUserRepository();
		const users = await userRepository.findAll();
		res.json(users);
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).json({ error: 'Failed to fetch users' });
	}
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = parseInt(req.params.id, 10);
		const userRepository = getUserRepository();
		const user = await userRepository.findById(id);

		if (!user) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		res.json(user);
	} catch (error) {
		console.error('Error fetching user:', error);
		res.status(500).json({ error: 'Failed to fetch user' });
	}
};

/**
 * Create new user
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
	try {
		const userData = req.body;

		const userRepository = getUserRepository();
		const existingUser = await userRepository.findByEmail(userData.email);
		if (existingUser) {
			res.status(409).json({ error: 'User with this email already exists' });
			return;
		}

		const newUser = await userRepository.create(userData);
		res.status(201).json(newUser);
	} catch (error) {
		console.error('Error creating user:', error);
		res.status(500).json({ error: 'Failed to create user' });
	}
};

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = parseInt(req.params.id, 10);
		const userData = req.body;

		const userRepository = getUserRepository();
		const updatedUser = await userRepository.update(id, userData);
		if (!updatedUser) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		res.json(updatedUser);
	} catch (error) {
		console.error('Error updating user:', error);
		res.status(500).json({ error: 'Failed to update user' });
	}
};

/**
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = parseInt(req.params.id, 10);
		const userRepository = getUserRepository();
		const result = await userRepository.delete(id);

		if (!result) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		res.json({ message: 'User deleted successfully' });
	} catch (error) {
		console.error('Error deleting user:', error);
		res.status(500).json({ error: 'Failed to delete user' });
	}
};