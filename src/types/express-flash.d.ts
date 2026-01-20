import 'express-session';

declare module 'express-session' {
  interface SessionData {
    flash?: {
      [key: string]: string[];
    };
    pendingUser?: {
      userId: string;
      email: string;
      username: string;
    };
  }
}
