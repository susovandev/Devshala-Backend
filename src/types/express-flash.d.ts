import 'express-session';
import { IFileShape } from 'models/user.model.ts';

declare module 'express-session' {
  interface SessionData {
    flash?: {
      [key: string]: string[];
    };
    user?: {
      _id: string;
      role: string;
      username: string;
      email: string;
      isEmailVerified: boolean;
      status: string;
      avatarUrl?: IFileShape | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }
}
