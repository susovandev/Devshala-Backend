/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, type Document } from 'mongoose';

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
  mustChangePassword: boolean;
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  isBlocked: boolean;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: Object.values(UserRole), default: UserRole.USER },
    isEmailVerified: { type: Boolean, required: true, default: false },
    mustChangePassword: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
