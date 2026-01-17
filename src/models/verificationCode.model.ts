/* eslint-disable no-unused-vars */
import { type ObjectId, Schema, model, type Document } from 'mongoose';

export enum VerificationType {
  ACCOUNT_VERIFICATION = 'account_verification',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  EMAIL_CHANGE = 'email_change',
}
export enum VerificationStatus {
  PENDING = 'pending',
  EXPIRED = 'expired',
  USED = 'used',
}
export interface IVerificationCodeDocument extends Document {
  userId: ObjectId;
  verificationCode: string;
  verificationCodeExpiration: Date;
  verificationType: VerificationType;
  verificationStatus: VerificationStatus;
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
  },
  { timestamps: true },
);

verificationCodeSchema.index({ userId: 1 }, { unique: true });

export default model<IVerificationCodeDocument>('VerificationCode', verificationCodeSchema);
