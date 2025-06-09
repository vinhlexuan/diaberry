import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

export const handleGoogleSignIn = (req: Request, res: Response): void => {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const oauthURL = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173/callback`;
  res.redirect(oauthURL);
};

export const handleCallback = (req: Request, res: Response): void => {
  // With Supabase, token handling is usually done client-side
  res.send("Callback received. Token handled by client.");
};