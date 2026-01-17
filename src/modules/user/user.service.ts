import Logger from '@config/logger.js';
import profileRepo from './profile.repo.js';
import { BadRequestError, ConflictError, NotFoundError } from '@libs/errors.js';
import { IUpdateUserProfileParams, IUserPasswordUpdateParams } from './user.types.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '@libs/cloudinary.js';
import fs from 'node:fs/promises';
import userRepo from './user.repo.js';
import authHelper from '@modules/auth/auth.helper.js';

class UserService {
  async getUserProfileService(userId: string) {
    Logger.debug('Getting user profile...');

    const profile = await profileRepo.getUserProfile(userId);
    if (!profile.length) {
      throw new NotFoundError('Profile not found');
    }
    return profile[0];
  }

  async updateUserProfileService(params: IUpdateUserProfileParams) {
    Logger.debug('Updating user profile...');

    const { userId, username, avatarLocalFilePath, bio, github, linkedin, twitter } = params;

    const profile = await profileRepo.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('User profile not found');
    }

    const updateFields: Partial<{
      bio: string;
      socialLinks: object;
      avatarUrl: { url: string; publicId: string };
    }> = {
      bio,
      socialLinks: {
        github,
        linkedin,
        twitter,
      },
    };

    // if (bio !== undefined) updateFields.bio = bio;
    // if (socialLinks !== undefined) updateFields.socialLinks = socialLinks;

    // Avatar handling
    if (avatarLocalFilePath) {
      const { secure_url, public_id } = await uploadOnCloudinary({
        localFilePath: avatarLocalFilePath,
      });

      await fs.unlink(avatarLocalFilePath);

      // delete old avatar
      if (profile.avatarUrl?.publicId) {
        await deleteFromCloudinary(profile.avatarUrl.publicId);
      }

      updateFields.avatarUrl = {
        url: secure_url,
        publicId: public_id,
      };
    }

    // Update username
    if (username) {
      await userRepo.updateUserName(userId, username);
    }
    // Update profile
    await profileRepo.updateUserProfile(userId, updateFields);

    return;
  }

  async updateUserPasswordService(params: IUserPasswordUpdateParams) {
    Logger.debug('Updating user password...');
    const { userId, oldPassword, newPassword, confirmPassword } = params;

    const user = await userRepo.getByUserId(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    const isPasswordMatch = await authHelper.comparePasswordHelper(oldPassword, user.passwordHash);
    if (!isPasswordMatch) {
      throw new ConflictError('Old password is incorrect');
    }

    const newPasswordHash = await authHelper.hashPasswordHelper(newPassword);
    if (!newPasswordHash) {
      throw new Error('Hashing password failed');
    }

    await userRepo.updatePassword({ userId, newPassword: newPasswordHash });

    return;
  }
}

export default new UserService();
