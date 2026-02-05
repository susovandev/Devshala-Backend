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
class PublisherProfileController {
  async getPublisherProfilePage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher profile page...');

      const publisherId = req?.user?._id;
      /**
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
        notificationModel
          .find({ recipientId: publisherId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        notificationModel.countDocuments({ recipientId: publisherId }),
        notificationModel.countDocuments({ recipientId: publisherId, isRead: false }),
      ]);

      return res.render('publishers/profile', {
        title: 'Publisher | Profile',
        pageTitle: 'Manage Profile',
        currentPath: '/publishers/profile',
        publisher: req?.user,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/auth/login');
    }
  }

  async updatePublisherAvatarHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating publisher avatar...');

      const user = req.user;
      const avatarLocalFilePath = req.file?.path;

      if (!avatarLocalFilePath) {
        throw new Error('Please change your avatar and try again');
      }

      // 2. upload avatar to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: avatarLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/publisher/avatar`,
      });
      if (!cloudinaryResponse) {
        Logger.warn('Avatar upload to cloudinary failed');
        throw new Error('Something went wrong please try again');
      }

      // 3. if avatar is uploaded successfully, update user avatar in db delete from cloudinary
      if (user && user.avatarUrl?.publicId) {
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
        throw new Error('Updating user avatar failed');
      }

      req.flash('success', 'Avatar updated successfully');
      return res.redirect('/publishers/profile');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/profile');
    } finally {
      //delete avatar local file
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

  async updatePublisherProfileHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating publisher profile...');
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
          return res.redirect('/publishers/profile');
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
        return res.redirect('/publishers/profile');
      }

      const updatedResult = await userModel.findByIdAndUpdate(
        userId,
        { $set: updatePayload },
        { new: true },
      );

      if (!updatedResult) {
        req.flash('error', 'Profile update failed');
        return res.redirect('/publishers/profile');
      }

      req.flash('success', 'Profile updated successfully');
      return res.redirect('/publishers/profile');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/profile');
    }
  }
}
export default new PublisherProfileController();
