/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';
import { Schema, model, type Document } from 'mongoose';

export enum VerificationType {
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  EMAIL_CHANGE = 'EMAIL_CHANGE',
}
export enum VerificationStatus {
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  USED = 'USED',
}
export interface IVerificationCodeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  verificationCode: string;
  verificationCodeExpiration: Date;
  verificationType: VerificationType;
  verificationStatus: VerificationStatus;
  verifyAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const verificationCodeSchema = new Schema<IVerificationCodeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    verificationCode: { type: String, required: true },
    verificationCodeExpiration: { type: Date, required: true },
    verificationType: { type: String, required: true, enum: Object.values(VerificationType) },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    verifyAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

verificationCodeSchema.index({ userId: 1, verificationType: 1 }, { unique: true });
verificationCodeSchema.index({ verificationCodeExpiration: 1 }, { expireAfterSeconds: 0 });

export default model<IVerificationCodeDocument>('VerificationCode', verificationCodeSchema);
