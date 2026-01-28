/* eslint-disable no-unused-vars */
import 'express';
import { IUserDocument } from 'models/user.model.ts';

declare module 'express' {
  interface Request {
    flash(type: string, message?: string | string[]): string[];
    user?: IUserDocument;
  }
}
