import dotenv from 'dotenv';

dotenv.config();

export class AuthService {
	getGoogleOAuthUrl(): string {
		const supabaseUrl = process.env.SUPABASE_URL || '';
		return `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173/callback`;
	}
}

// Export a singleton instance
export const authService = new AuthService();