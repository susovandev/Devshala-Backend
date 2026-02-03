import mongoose, { Schema, model } from 'mongoose';

export interface IRefreshTokenDocument {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
    },

    ip: { type: String },
    userAgent: { type: String },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

export default model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
