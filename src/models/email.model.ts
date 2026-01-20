/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';
import { UserRole } from './user.model.js';

export enum EmailStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export interface IEmailDocument extends mongoose.Document {
  sender?: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  recipientEmail: string;
  subject: string;
  body: string;
  source: UserRole;
  sendAt: Date;
  status: EmailStatus;
  createdAt: Date;
  updatedAt: Date;
}

const emailSchema = new mongoose.Schema<IEmailDocument>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientEmail: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    source: { type: String, enum: Object.values(UserRole), required: true },
    sendAt: { type: Date, default: Date.now },
    status: { type: String, enum: Object.values(EmailStatus) },
  },
  { timestamps: true },
);

emailSchema.index({ recipient: 1, status: 1 });
emailSchema.index({ sendAt: 1, status: 1 });

export default mongoose.model<IEmailDocument>('Email', emailSchema);
