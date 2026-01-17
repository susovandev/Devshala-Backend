/* eslint-disable no-unused-vars */
import { Schema, model, type Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PUBLISHER = 'publisher',
  AUTHOR = 'author',
}

export interface IUserDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  isDeleted: boolean;
  isBlocked: boolean;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(UserRole), default: UserRole.USER },
    isEmailVerified: { type: Boolean, required: true, default: false },
    isDeleted: { type: Boolean, required: true, default: false, index: true },
    isBlocked: { type: Boolean, required: true, default: false },
    isDisabled: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ role: 1 });

export default model<IUserDocument>('User', userSchema);
