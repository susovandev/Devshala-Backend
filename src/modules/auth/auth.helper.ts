import bcrypt from 'bcryptjs';
import { IUserDocument, UserRole } from 'models/user.model.js';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import {
  ACCESS_TOKEN_TTL,
  FORGOT_PASSWORD_EXPIRY_MINUTES,
  REFRESH_TOKEN_TTL,
} from './auth.constants.js';
import Logger from '@config/logger.js';

interface IResetPasswordJwtPayload {
  sub: string;
  role: UserRole;
}

class AuthHelper {
  async hashPasswordHelper(password: string): Promise<string | null> {
    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);
    if (!hashedPassword) return null;
    return hashedPassword;
  }

  async comparePasswordHelper(password: string, hashedPassword: string): Promise<boolean> {
    if (!hashedPassword) return false;
    const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordCorrect) return false;
    return isPasswordCorrect;
  }

  generateRandomOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  hashVerificationCodeHelper(verificationCode: string): string | null {
    const verificationCodeHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
    if (!verificationCodeHash) return null;
    return verificationCodeHash;
  }

  signAccessToken(user: IUserDocument): string | null {
    const payload: IResetPasswordJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };
    const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: ACCESS_TOKEN_TTL,
    } as jwt.SignOptions);
    return accessToken;
  }

  signRefreshToken(user: IUserDocument): string | null {
    const payload: IResetPasswordJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };
    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET_KEY, {
      expiresIn: REFRESH_TOKEN_TTL,
    } as jwt.SignOptions);
    return refreshToken;
  }

  signAccessTokenAndRefreshToken(user: IUserDocument) {
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
    };
  }

  verifyAccessToken(token: string): jwt.JwtPayload {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET_KEY) as jwt.JwtPayload;
  }

  generateResetPasswordSecret(user: IUserDocument): string {
    const payload: IResetPasswordJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };

    return jwt.sign(payload, env.FORGOT_PASSWORD_SECRET_KEY, {
      expiresIn: FORGOT_PASSWORD_EXPIRY_MINUTES,
    });
  }

  verifyResetPasswordSecret(token: string): IResetPasswordJwtPayload | null {
    Logger.debug('Verifying reset password token...');

    if (!token) return null;

    try {
      const decoded = jwt.verify(token, env.FORGOT_PASSWORD_SECRET_KEY) as jwt.JwtPayload;

      if (!decoded) {
        return null;
      }

      return {
        sub: decoded.sub as string,
        role: decoded.role as UserRole,
      };
    } catch (error) {
      Logger.error('Reset password token verification failed', error);
      return null;
    }
  }
}

export default new AuthHelper();
