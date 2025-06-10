import { Request, Response } from 'express';
import { getUserRepository } from '../repositories/UserRepository';

export const createUserFromGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, google_id, first_name, last_name, avatar_url } = req.body;
    
    if (!email || !google_id) {
      res.status(400).json({ error: 'Email and Google ID are required' });
      return;
    }

    console.log('Received user data:', { email, google_id, first_name, last_name, avatar_url });

    const userRepository = getUserRepository();
    const user = await userRepository.createOrUpdateGoogleUser({
      email,
      google_id,
      first_name,
      last_name,
      avatar_url
    });

    res.status(201).json({ 
      success: true,
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Error creating user from Google:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};