import bcrypt from 'bcryptjs';
import { IUserDocument } from 'models/user.model.js';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import {
  ACCESS_TOKEN_TTL,
  FORGOT_PASSWORD_EXPIRY_MINUTES,
  REFRESH_TOKEN_TTL,
} from './auth.constants.js';
import { randomUUID } from 'node:crypto';

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
    const accessToken = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        jti: randomUUID(),
      },
      env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: ACCESS_TOKEN_TTL } as jwt.SignOptions,
    );
    return accessToken;
  }

  signRefreshToken(user: IUserDocument): string | null {
    const refreshToken = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        jti: randomUUID(),
      },
      env.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: REFRESH_TOKEN_TTL } as jwt.SignOptions,
    );
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
    return jwt.sign(
      {
        sub: user._id,
        role: user.role,
      },
      env.FORGOT_PASSWORD_SECRET_KEY,
      { expiresIn: FORGOT_PASSWORD_EXPIRY_MINUTES },
    );
  }
}

export default new AuthHelper();
