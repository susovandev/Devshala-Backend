/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'node:fs/promises';
import Logger from '@config/logger.js';
import {
  CloudinaryResourceType,
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '@libs/cloudinary.js';
import { CLOUDINARY_FOLDER_NAME } from 'constants/index.js';
import type { Request, Response } from 'express';
import userModel from 'models/user.model.js';
import notificationModel from 'models/notification.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import { redisDel, redisGet, redisSet } from '@libs/redis.js';

export function expandDotNotation(input: Record<string, any>) {
  const output: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!key.includes('.')) {
      output[key] = value;
      continue;
    }

    const parts = key.split('.');
    let current = output;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        if (value !== '') current[part] = value;
      } else {
        current[part] ??= {};
        current = current[part];
      }
    }
  }

  return output;
}

class UserProfileController {
  async getUserProfilePage(req: Request, res: Response) {
    Logger.info('Getting user profile page...');

    const userId = req?.user?._id;

    // TODO: Fetch profile from cache
    const cacheKey = `user:${userId}:profile`;
    if (cacheKey) {
      const cachedData = await redisGet(cacheKey);
      if (cachedData) {
        Logger.info('Fetching profile from cache...');
        return res.render('users/profile', cachedData);
      }
    }

    /**
     * Get notifications
     * Count total notifications
     * Count total unread notifications
     */
    const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
      notificationModel.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(8).lean(),
      notificationModel.countDocuments({ recipientId: userId }),
      notificationModel.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    // TODO: Save profile to cache
    if (cacheKey) {
      await redisSet(
        cacheKey,
        {
          title: 'User | Profile',
          pageTitle: 'User Profile',
          currentPath: '/users/profile',
          user: req?.user,
          notifications,
          totalNotifications,
          totalUnreadNotifications,
        },
        300,
      );
      Logger.info('Saving profile to cache...');
    }

    return res.render('users/profile', {
      title: 'User | Profile',
      pageTitle: 'User Profile',
      currentPath: '/users/profile',
      user: req?.user,
      notifications,
      totalNotifications,
      totalUnreadNotifications,
    });
  }

  async getChangePasswordPage(req: Request, res: Response) {
    Logger.info('Getting user change password page...');

    return res.render('users/auth/change-password', {
      title: 'User | Change Password',
      pageTitle: 'User Change Password',
    });
  }

  async updateUserAvatarHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating user avatar...');

      const user = req?.user;
      const avatarLocalFilePath = req?.file?.path;

      // 1.Check if local file path is not found
      if (!avatarLocalFilePath) {
        throw new Error('Avatar file is required');
      }

      // 2. upload avatar to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: avatarLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/user/avatar`,
      });
      if (!cloudinaryResponse) {
        Logger.warn('Uploading avatar to cloudinary failed');
        throw new Error('Something went wrong please try again');
      }

      // 3. if avatar is uploaded successfully, update user avatar in db delete from cloudinary
      if (user && user?.avatarUrl?.publicId) {
        await deleteFromCloudinary(user?.avatarUrl?.publicId);
      }

      // 4. update user avatar in db
      const updatedResult = await userModel.findByIdAndUpdate(
        user?._id,
        {
          avatarUrl: {
            url: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id,
          },
        },
        { new: true },
      );
      if (!updatedResult) {
        Logger.error('Updating user avatar failed');
        throw new Error('Something went wrong please try again');
      }

      // TODO: Delete user profile from cache
      const cacheKey = `user:${user?._id}:profile`;
      if (cacheKey) {
        await redisDel(cacheKey);
        Logger.info('Deleting user profile cache...');
      }

      req.flash('success', 'Avatar updated successfully');
      return res.redirect('/users/profile');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/profile');
    } finally {
      // 5. delete avatar local file
      if (req?.file?.path) {
        try {
          await fs.unlink(req?.file?.path);
          Logger.info('Avatar local file deleted successfully');
        } catch (error) {
          Logger.error(`${(error as Error).message}`);
        }
      }
    }
  }

  async updateUserProfileHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating user profile...');
      const userId = req.user?._id;

      //Normalize body
      const body = expandDotNotation(req.body);

      const { username, bio, socialLinks } = body;

      const updatePayload: Record<string, any> = {};

      // Username
      if (username?.trim()) {
        const existingUser = await userModel.findOne({
          username,
          _id: { $ne: userId },
        });

        if (existingUser) {
          req.flash('error', 'This username is already taken');
          return res.redirect('/users/profile');
        }

        updatePayload.username = username.trim();
      }

      // Bio
      if (bio !== undefined) {
        updatePayload.bio = bio.trim();
      }

      //Social links
      if (socialLinks && typeof socialLinks === 'object') {
        for (const [key, value] of Object.entries(socialLinks)) {
          if (typeof value === 'string' && value.trim() !== '') {
            updatePayload[`socialLinks.${key}`] = value.trim();
          }
        }
      }

      if (Object.keys(updatePayload).length === 0) {
        req.flash('info', 'No changes detected');
        return res.redirect('/users/profile');
      }

      const updatedResult = await userModel.findByIdAndUpdate(
        userId,
        { $set: updatePayload },
        { new: true },
      );

      if (!updatedResult) {
        req.flash('error', 'Profile update failed');
        return res.redirect('/users/profile');
      }

      const cacheKey = `user:${userId}:profile`;
      if (cacheKey) {
        await redisDel(cacheKey);
        Logger.info('Deleting user profile cache...');
      }

      req.flash('success', 'Profile updated successfully');
      return res.redirect('/users/profile');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/profile');
    }
  }

  async changePasswordHandler(req: Request, res: Response) {
    try {
      Logger.info(`Update user password route called`);

      const userId = req?.user?._id;

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // 2.Compare newPassword and comparePassword
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // 1.Find user with userId
      const user = await userModel.findById(userId).select('+passwordHash');
      if (!user) {
        throw new Error('User not found');
      }

      // 3. Check password
      const isPasswordMatch = await authHelper.comparePasswordHelper(
        currentPassword,
        user.passwordHash,
      );
      if (!isPasswordMatch) {
        throw new Error('Current password is incorrect');
      }

      // 4. Hash password
      const newPasswordHash = await authHelper.hashPasswordHelper(newPassword);
      if (!newPasswordHash) {
        throw new Error('Some error occurred please try again');
      }

      // 5. Update password
      const updatedResult = await userModel.findByIdAndUpdate(
        user?._id,
        {
          passwordHash: newPasswordHash,
        },
        { new: true },
      );
      if (!updatedResult) {
        throw new Error('Some error occurred please try again');
      }

      // 6. Remove refresh token
      const deletedRefreshTokenRecord = await refreshTokenModel.deleteMany({
        userId,
      });
      if (!deletedRefreshTokenRecord) {
        throw new Error('Some error occurred please try again');
      }

      Logger.info('Password updated successfully');

      req.flash('success', 'Password updated successfully');
      return res.redirect('/users/auth/login');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/users/profile/change-password');
    }
  }
}
export default new UserProfileController();
