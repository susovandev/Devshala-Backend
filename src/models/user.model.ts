/* eslint-disable no-unused-vars */
import mongoose, { Schema, model, type Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IFileShape {
  publicId: string;
  url: string;
}

export interface IUserSocialLinksShape {
  github: string;
  linkedin: string;
  twitter: string;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  PUBLISHER = 'publisher',
  AUTHOR = 'author',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  DISABLED = 'DISABLED',
}

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;

  avatarUrl?: IFileShape;
  bio?: string;
  socialLinks?: IUserSocialLinksShape;

  mustChangePassword: boolean;
  createdBy?: mongoose.Types.ObjectId;
  status: UserStatus;

  blockedReason?: string;
  blockedAt?: Date;
  blockedBy?: mongoose.Types.ObjectId;

  unblockedAt?: Date;
  unblockedBy?: mongoose.Types.ObjectId;

  disabledReason?: string;
  disabledAt?: Date;
  disabledBy?: mongoose.Types.ObjectId;

  enabledAt?: Date;
  enabledBy?: mongoose.Types.ObjectId;

  isDeleted: boolean;
  deletedReason?: string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;

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
    avatarUrl: {
      publicId: { type: String },
      url: { type: String },
    },
    bio: { type: String },
    socialLinks: {
      github: { type: String },
      linkedin: { type: String },
      twitter: { type: String },
    },

    mustChangePassword: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },

    blockedReason: { type: String },
    blockedAt: { type: Date },
    blockedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    unblockedAt: { type: Date },
    unblockedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    disabledReason: { type: String },
    disabledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disabledAt: { type: Date },

    enabledAt: { type: Date },
    enabledBy: { type: Schema.Types.ObjectId, ref: 'User' },

    isDeleted: { type: Boolean, default: false },
    deletedReason: { type: String },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ role: 1 });

userSchema.plugin(mongoosePaginate);
export default model<IUserDocument, mongoose.PaginateModel<IUserDocument>>('User', userSchema);
