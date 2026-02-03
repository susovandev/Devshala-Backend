/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, Document } from 'mongoose';

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}
export interface ILoginDocument extends Document {
  userId: string;
  lastLoginIp: string;
  lastLoginUserAgent: string;
  lastLoginStatus: LoginStatus;
  lastLoginAt?: Date;
  lastLoginAttempt: Date;
}

const loginSchema = new Schema<ILoginDocument>({
  userId: { type: String, required: true },
  lastLoginIp: { type: String, required: true },
  lastLoginUserAgent: { type: String, required: true },
  lastLoginStatus: { type: String, required: true, enum: Object.values(LoginStatus) },
  lastLoginAt: { type: Date },
  lastLoginAttempt: { type: Date, default: Date.now },
});

loginSchema.index({ userId: 1, lastLoginAt: -1 });
loginSchema.index({ ip: 1 });

export default model<ILoginDocument>('Login', loginSchema);
