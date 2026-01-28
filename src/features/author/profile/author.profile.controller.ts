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
import { TUserUpdateProfileDTO } from '@modules/publishers/profile/profile.validations.js';
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
class AuthorProfileController {
  async getAuthorProfilePage(req: Request, res: Response) {
    try {
      Logger.info('Getting Author profile page...');

      if (!req.user) {
        Logger.error('Author not found');
        req.flash('error', 'Author not found please try again');
        return res.redirect('/authors/auth/login');
      }

      // Get notifications
      const notifications = await notificationModel
        .find({
          recipientId: req.user._id,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      // Get total notifications
      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

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
      const user = req.user;
      const avatarLocalFilePath = req.file?.path;

      if (!user) {
        Logger.warn('Author not found');

        req.flash('error', 'User not found please try again');
        return res.redirect('/authors/profile');
      }

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
        user._id,
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

  async updateAuthorProfileHandler(
    req: Request<object, object, TUserUpdateProfileDTO>,
    res: Response,
  ) {
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
}
export default new AuthorProfileController();
