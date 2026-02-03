import bcrypt from 'bcryptjs';
import { type Request } from 'express';
import { IUserDocument, UserRole } from 'models/user.model.js';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import Logger from '@config/logger.js';
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  PASSWORD_HASH_SALT_ROUNDS,
  REFRESH_TOKEN_EXPIRATION_TIME,
  RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
} from 'constants/index.js';

interface IResetPasswordJwtPayload {
  sub: string;
  role: UserRole;
}

class AuthHelper {
  async hashPasswordHelper(password: string): Promise<string | null> {
    Logger.debug('Hashing password...');
    const genSalt = await bcrypt.genSalt(PASSWORD_HASH_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, genSalt);
    if (!hashedPassword) return null;
    return hashedPassword;
  }

  async comparePasswordHelper(password: string, hashedPassword: string): Promise<boolean> {
    Logger.debug('Comparing password...');
    if (!hashedPassword) return false;
    const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordCorrect) return false;
    return isPasswordCorrect;
  }

  async hashVerifyOtpHelper(verifyOtp: string): Promise<string | null> {
    Logger.debug('Hashing verification code...');
    const genSalt = await bcrypt.genSalt(PASSWORD_HASH_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(verifyOtp, genSalt);
    if (!hashedPassword) return null;
    return hashedPassword;
  }

  async verifyOtpHelper(verificationCode: string, verificationCodeHash: string): Promise<boolean> {
    Logger.debug('Verifying verification code...');
    const isVerificationCodeCorrect = await bcrypt.compare(verificationCode, verificationCodeHash);
    if (!isVerificationCodeCorrect) return false;
    return isVerificationCodeCorrect;
  }

  generateStrongRandomPassword(): string | null {
    Logger.debug('Generating strong random password...');
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }
    if (!password) return null;
    return password;
  }

  generateRandomOtp(): number | null {
    Logger.debug('Generating verification code...');
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    if (!verificationCode) return null;
    return verificationCode;
  }

  hashVerificationCodeHelper(verificationCode: string): string | null {
    Logger.debug('Hashing verification code...');
    const verificationCodeHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
    if (!verificationCodeHash) return null;
    return verificationCodeHash;
  }

  signAccessToken(user: IUserDocument): string | null {
    Logger.debug('Signing access token...');
    if (!user) return null;
    const payload: IResetPasswordJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };
    const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: ACCESS_TOKEN_EXPIRATION_TIME,
    } as jwt.SignOptions);
    if (!accessToken) return null;
    return accessToken;
  }

  signRefreshToken(user: IUserDocument): string | null {
    Logger.debug('Signing refresh token...');
    if (!user) return null;
    const payload: IResetPasswordJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };
    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET_KEY, {
      expiresIn: REFRESH_TOKEN_EXPIRATION_TIME,
    } as jwt.SignOptions);
    if (!refreshToken) return null;
    return refreshToken;
  }

  signAccessTokenAndRefreshToken(user: IUserDocument) {
    Logger.debug('Signing access token and refresh token...');
    if (!user) return null;

    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    if (!accessToken || !refreshToken) return null;
    return {
      accessToken,
      refreshToken,
    };
  }

  verifyAccessToken(token: string): jwt.JwtPayload | null {
    Logger.debug('Verifying access token...');
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET_KEY) as jwt.JwtPayload;
    if (!decoded) {
      return null;
    }
    return decoded;
  }

  verifyRefreshToken(token: string): jwt.JwtPayload | null {
    Logger.debug('Verifying refresh token...');
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET_KEY) as jwt.JwtPayload;
    if (!decoded) {
      return null;
    }
    return decoded;
  }
  generateResetPasswordSecret(user: IUserDocument): string | null {
    Logger.debug('Generating reset password token...');
    const payload: IResetPasswordJwtPayload = {
      sub: user._id.toString(),
      role: user.role,
    };

    const token = jwt.sign(payload, env.FORGOT_PASSWORD_SECRET_KEY, {
      expiresIn: RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
    });

    if (!token) return null;
    return token;
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

  getClientMeta = (req: Request) => {
    const forwardedFor = req.headers['x-forwarded-for'];

    return {
      ip:
        (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]) ||
        req.ip ||
        'UNKNOWN_IP',

      userAgent: req.headers['user-agent'] || 'UNKNOWN_AGENT',
    };
  };
}

export default new AuthHelper();
