import mongoose, { Schema, model, Document } from 'mongoose';

export interface IFileShape {
  publicId: string;
  url: string;
}

export interface IUserSocialLinksShape {
  github: string;
  linkedin: string;
  twitter: string;
}
export interface IUserProfileDocument extends Document {
  userId: mongoose.Types.ObjectId;
  avatarUrl: IFileShape;
  bio: string;
  socialLinks: IUserSocialLinksShape;
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfileDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
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
  },
  { timestamps: true },
);

export default model<IUserProfileDocument>('UserProfile', userProfileSchema);
