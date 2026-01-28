/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import Logger from '@config/logger.js';
import {
  CloudinaryResourceType,
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '@libs/cloudinary.js';
import { CLOUDINARY_FOLDER_NAME } from 'constants/index.js';
import authHelper from '@modules/auth/auth.helper.js';
import refreshTokenModel from 'models/refreshToken.model.js';
import userModel from 'models/user.model.js';

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

class publisherProfileController {
  async renderPublisherProfilePage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher profile page...');

      if (!req.user) {
        Logger.warn('publisher not found');

        req.flash('error', 'publisher not found please try again');
        return res.redirect('/publishers/auth/login');
      }

      return res.render('publishers/profile', {
        title: 'publisher | Profile',
        pageTitle: 'publisher Profile',
        publisher: req.user,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/auth/login');
    }
  }

  async updatePublisherAvatarHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating publisher avatar...');
      const publisher = req.user;
      const avatarLocalFilePath = req.file?.path;

      if (!publisher) {
        Logger.warn('publisher not found');

        req.flash('error', 'publisher not found please try again');
        return res.redirect('/publishers/profile');
      }

      // 1.Check if local file path is not found
      if (!avatarLocalFilePath) {
        Logger.warn('publisher id or avatar local file path not found');

        req.flash('error', 'Please change your avatar and try again');
        return res.redirect('/publishers/profile');
      }

      // 2. upload avatar to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: avatarLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/publisher/avatar`,
      });
      if (!cloudinaryResponse) {
        Logger.warn('Uploading avatar to cloudinary failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/profile');
      }

      // 3. if avatar is uploaded successfully, update publisher avatar in db delete from cloudinary
      if (publisher && publisher.avatarUrl?.publicId) {
        await deleteFromCloudinary(publisher?.avatarUrl?.publicId);
      }

      // 4. update publisher avatar in db
      const updatedResult = await userModel.findByIdAndUpdate(
        publisher.userId,
        {
          avatarUrl: {
            url: cloudinaryResponse.secure_url,
            publicId: cloudinaryResponse.public_id,
          },
        },
        { new: true },
      );
      if (!updatedResult) {
        Logger.warn('Updating publisher avatar failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/profile');
      }

      req.flash('success', 'Avatar updated successfully');
      return res.redirect('/publishers/profile');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/profile');
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

  async updatePublisherProfileHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating publisher profile...');
      const publisherId = req.user?.userId;

      //Normalize body
      const body = expandDotNotation(req.body);

      const { username, bio, socialLinks } = body;

      const updatePayload: Record<string, any> = {};

      // publishername
      if (username?.trim()) {
        const existingPublisher = await userModel.findOne({
          username,
          _id: { $ne: publisherId },
        });

        if (existingPublisher) {
          req.flash('error', 'This publisherName is already taken');
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
        publisherId,
        { $set: updatePayload },
        { new: true },
      );

      if (!updatedResult) {
        req.flash('error', 'Profile update failed');
        return res.redirect('/publishers/profile');
      }

      req.flash('success', 'Profile updated successfully');
      return res.redirect('/publishers/profile');
    } catch (error) {
      Logger.error((error as Error).message);
      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/profile');
    }
  }

  async renderPublisherChangePasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher change password page...');

      return res.render('publishers/auth/change-password', {
        title: 'publisher | Change Password',
        pageTitle: 'publisher Change Password',
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/auth/profile');
    }
  }

  async publisherChangePasswordHandler(req: Request, res: Response) {
    try {
      Logger.info(`Update publisher password route called`);

      const publisherId = req.user?.userId;

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate publisherId
      if (!publisherId) {
        Logger.warn('publisherId not provided');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/publishers/profile');
      }

      // 1.Find publisher with publisherId
      const publisher = await userModel.findById(publisherId).select('+passwordHash');
      if (!publisher) {
        Logger.warn('publisher not found in db');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/publishers/auth/login');
      }

      // 2.Compare newPassword and comparePassword
      if (newPassword !== confirmPassword) {
        Logger.warn('Passwords do not match');

        req.flash('error', 'Passwords do not match');
        return res.redirect('/publishers/profile/change-password');
      }

      // 3. Check password
      const isPasswordMatch = await authHelper.comparePasswordHelper(
        currentPassword,
        publisher.passwordHash,
      );
      if (!isPasswordMatch) {
        Logger.warn('Password is incorrect');

        req.flash('Please enter correct password');
        return res.redirect('/publishers/profile/change-password');
      }

      // 4. Hash password
      const newPasswordHash = await authHelper.hashPasswordHelper(newPassword);
      if (!newPasswordHash) {
        Logger.warn('Hashing password failed');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/publishers/profile/change-password');
      }

      // 5. Update password
      const updatedResult = await userModel.findByIdAndUpdate(
        publisher?._id,
        {
          passwordHash: newPasswordHash,
        },
        { new: true },
      );
      if (!updatedResult) {
        Logger.warn('Updating password failed');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/publishers/profile/change-password');
      }

      // 6. Remove refresh token
      const deletedRefreshTokenRecord = await refreshTokenModel.deleteMany({
        publisherId,
      });
      if (!deletedRefreshTokenRecord) {
        Logger.warn('Deleting refresh token record failed');

        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/publishers/profile');
      }

      req.flash('success', 'Password updated successfully');
      return res.redirect('/publishers/auth/login');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/profile/change-password');
    }
  }
}

export default new publisherProfileController();
