/* eslint-disable no-unused-vars */
import { IAuthUserShape } from '@modules/auth/auth.types.ts';
import 'express';

declare module 'express' {
  interface Request {
    flash(type: string, message?: string | string[]): string[];
    user?: IAuthUserShape;
  }
}
