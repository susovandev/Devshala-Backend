/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';
import { UserRole } from './user.model.js';

export enum EmailType {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  PUBLISHER_CREDENTIALS = 'PUBLISHER_CREDENTIALS',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  EMAIL_CHANGE = 'EMAIL_CHANGE',
  NEW_USER = 'NEW_USER',
  BLOG_CREATED = 'BLOG_CREATED',
  NEW_BLOG = 'NEW_BLOG',
  BLOG_APPROVED = 'BLOG_APPROVED',
  BLOG_REJECTED = 'BLOG_REJECTED',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  BOOKMARK = 'BOOKMARK',
  AUTHOR_REQUEST = 'AUTHOR_REQUEST',
  BLOG_UNWANTED_CONTENT = 'BLOG_UNWANTED_CONTENT',
  AUTHOR_ACCOUNT_CREATED = 'AUTHOR_ACCOUNT_CREATED',
  ACCOUNT_BLOCKED = 'ACCOUNT_BLOCKED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
}

export enum EmailSource {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  ADMIN = 'ADMIN',
  PUBLISHER = 'PUBLISHER',
  AUTHOR = 'AUTHOR',
}

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
  type: EmailType;
  source: EmailSource;
  sendAt?: Date;
  status: EmailStatus;
  createdAt: Date;
  updatedAt: Date;
}

const emailSchema = new mongoose.Schema<IEmailDocument>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(EmailType), required: true },
    recipientEmail: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    source: { type: String, enum: Object.values(EmailSource), required: true },
    sendAt: { type: Date },
    status: { type: String, enum: Object.values(EmailStatus) },
  },
  { timestamps: true },
);

emailSchema.index({ recipient: 1, status: 1 });
emailSchema.index({ sendAt: 1, status: 1 });

export default mongoose.model<IEmailDocument>('Email', emailSchema);
