import { User } from '../entities/User';
import { Session } from '../entities/Session';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

export {};