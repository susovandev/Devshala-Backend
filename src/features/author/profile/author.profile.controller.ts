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
import { redisDel, redisGet, redisSet } from '@libs/redis.js';
import authHelper from '@modules/auth/auth.helper.js';
import refreshTokenModel from 'models/refreshToken.model.js';

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
class AuthorProfileController {
  async getAuthorProfilePage(req: Request, res: Response) {
    try {
      Logger.info('Getting Author profile page...');

      const authorId = req?.user?._id;

      const cacheKey = `author:profile:authorId:${authorId}`;

      if (cacheKey) {
        Logger.info('Fetching author profile from cache...');
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
          return res.render('authors/profile', cachedData);
        }
      }

      /**
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
        notificationModel.find({ recipientId: authorId }).sort({ createdAt: -1 }).limit(8).lean(),
        notificationModel.countDocuments({ recipientId: authorId }),
        notificationModel.countDocuments({ recipientId: authorId, isRead: false }),
      ]);

      await redisSet(
        cacheKey,
        {
          title: 'Author | Profile',
          pageTitle: 'Author Profile',
          currentPath: '/authors/profile',
          author: req.user,
          notifications,
          totalUnreadNotifications,
          totalNotifications,
        },
        300,
      );

      return res.render('authors/profile', {
        title: 'Author | Profile',
        pageTitle: 'Author Profile',
        currentPath: '/authors/profile',
        author: req.user,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/authors/auth/login');
    }
  }

  async updateAuthorAvatarHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating authors avatar...');
      const user = req?.user;
      const authorId = req?.user?._id;
      const avatarLocalFilePath = req.file?.path;

      // 1.Check if local file path is not found
      if (!avatarLocalFilePath) {
        Logger.warn('User id or avatar local file path not found');

        req.flash('error', 'Please change your avatar and try again');
        return res.redirect('/authors/profile');
      }

      // 2. upload avatar to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: avatarLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/authors/avatar`,
      });
      if (!cloudinaryResponse) {
        Logger.warn('Uploading avatar to cloudinary failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/authors/profile');
      }

      // 3. if avatar is uploaded successfully, update user avatar in db delete from cloudinary
      if (user && user.avatarUrl?.publicId) {
        await deleteFromCloudinary(user?.avatarUrl?.publicId);
      }

      // 4. update user avatar in db
      const updatedResult = await userModel.findByIdAndUpdate(
        authorId,
        {
          avatarUrl: {
            url: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id,
          },
        },
        { new: true },
      );
      if (!updatedResult) {
        Logger.warn('Updating user avatar failed');

        const cacheKey = `author:profile:authorId:${authorId}`;
        if (cacheKey) {
          await redisDel(cacheKey);
        }

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/authors/profile');
      }

      req.flash('success', 'Avatar updated successfully');
      return res.redirect('/authors/profile');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/authors/profile');
    } finally {
      // 5. delete avatar local file
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
          Logger.info('Avatar local file deleted successfully');
        } catch (error) {
          Logger.error(`${(error as Error).message}`);
        }
      }
    }
  }

  async updateAuthorProfileHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating author profile...');
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
          return res.redirect('/authors/profile');
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
        return res.redirect('/authors/profile');
      }

      const updatedResult = await userModel.findByIdAndUpdate(
        userId,
        { $set: updatePayload },
        { new: true },
      );

      if (!updatedResult) {
        req.flash('error', 'Profile update failed');
        return res.redirect('/authors/profile');
      }

      req.flash('success', 'Profile updated successfully');
      return res.redirect('/authors/profile');
    } catch (error) {
      Logger.error((error as Error).message);
      req.flash('error', (error as Error).message);
      return res.redirect('/authors/profile');
    }
  }

  async getAuthorChangePasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Getting author change password page...');

      return res.render('authors/auth/change-password', {
        title: 'Author | Change Password',
        pageTitle: 'Author Change Password',
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/authors/auth/login');
    }
  }

  async changePasswordHandler(req: Request, res: Response) {
    try {
      Logger.info(`Update author password route called`);

      const authorId = req?.user?._id;

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // 2.Compare newPassword and comparePassword
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // 1.Find user with userId
      const author = await userModel.findById(authorId).select('+passwordHash');
      if (!author) {
        throw new Error('Account not found');
      }

      // 3. Check password
      const isPasswordMatch = await authHelper.comparePasswordHelper(
        currentPassword,
        author.passwordHash,
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
        author?._id,
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
        userId: author?._id,
      });
      if (!deletedRefreshTokenRecord) {
        throw new Error('Some error occurred please try again');
      }

      Logger.info('Password updated successfully');

      req.flash('success', 'Password updated successfully');
      return res.redirect('/authors/auth/login');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/authors/profile/change-password');
    }
  }
}
export default new AuthorProfileController();
