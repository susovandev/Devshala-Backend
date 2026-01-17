import { LoginStatus } from 'models/login.model.js';

export interface ISignupRequestBody {
  username: string;
  email: string;
  password: string;
}

export interface ICreateVerificationCodeParams {
  userId: string;
  verificationCode: string;
  verificationCodeExpiration: Date;
  verificationType: string;
}

export interface IVerifyEmailRequestBody {
  userId: string;
  verificationCode: string;
}

export interface IGetVerificationCodeParams {
  userId: string;
  verificationCodeHash?: string;
  verificationType: string;
  verificationStatus: string;
}

export interface ILoginRequestBody {
  email: string;
  password: string;
  ip: string;
  userAgent: string;
}

export interface ICreateLoginRecordParam {
  userId?: string;
  lastLoginIp: string;
  lastLoginUserAgent: string;
  lastLoginStatus: LoginStatus;
}

export interface ICreateRefreshTokenRecordParam {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked?: boolean;
  ip: string;
  userAgent: string;
}
