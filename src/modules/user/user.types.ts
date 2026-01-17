/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRole } from 'models/user.model.js';

export interface IGetUserParams {
  username: string;
  email: string;
}

export interface ICreateUserParams {
  username: string;
  email: string;
  passwordHash: string;
}

export interface IUserProfileResponseDTO {
  avatarUrl?: {
    publicId: string;
    url: string;
  };
  bio?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface IGetUserResponseResult {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isDeleted: boolean;
  isBlocked: boolean;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile: IUserProfileResponseDTO;
}

export function sendUserInformation(user: any): IGetUserResponseResult {
  return {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isDeleted: user.isDeleted,
    isBlocked: user.isBlocked,
    isDisabled: user.isDisabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: {
      avatarUrl: user.profile?.avatarUrl,
      bio: user.profile?.bio,
      socialLinks: user.profile?.socialLinks,
    },
  };
}
