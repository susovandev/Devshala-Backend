/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, Document } from 'mongoose';

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}
export interface ILoginDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  lastLoginIp: string;
  lastLoginUserAgent: string;
  lastLoginStatus: LoginStatus;
  lastLoginAt: Date;
}

const loginSchema = new Schema<ILoginDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  lastLoginIp: { type: String, required: true },
  lastLoginUserAgent: { type: String, required: true },
  lastLoginStatus: { type: String, required: true, enum: Object.values(LoginStatus) },
  lastLoginAt: { type: Date, default: Date.now },
});

loginSchema.index({ userId: 1, lastLoginAt: -1 });
loginSchema.index({ ip: 1 });

export default model<ILoginDocument>('Login', loginSchema);
