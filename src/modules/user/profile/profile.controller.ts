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
import userModel from 'models/user.model.js';
import { TUserUpdateProfileDTO } from './profile.validations.js';
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

class UserProfileController {
  async renderUserProfilePage(req: Request, res: Response) {
    try {
      Logger.info('Getting user profile page...');

      if (!req.user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/users/auth/login');
      }

      return res.render('users/profile', {
        title: 'User | Profile',
        pageTitle: 'User Profile',
        user: req.user,
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/login');
    }
  }

  async updateUserAvatarHandler(req: Request, res: Response) {
    try {
      Logger.info('Updating user avatar...');
      const user = req.user;
      const avatarLocalFilePath = req.file?.path;

      if (!user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/users/profile');
      }

      // 1.Check if local file path is not found
      if (!avatarLocalFilePath) {
        Logger.error('User id or avatar local file path not found');
        req.flash('error', 'Please change your avatar and try again');
        return res.redirect('/users/profile');
      }

      // 2. upload avatar to cloudinary
      const cloudinaryResponse = await uploadOnCloudinary({
        localFilePath: avatarLocalFilePath,
        resourceType: CloudinaryResourceType.IMAGE,
        uploadFolder: `${CLOUDINARY_FOLDER_NAME}/user/avatar`,
      });
      if (!cloudinaryResponse) {
        Logger.error('Uploading avatar to cloudinary failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/users/profile');
      }

      // 3. if avatar is uploaded successfully, update user avatar in db delete from cloudinary
      if (user && user.avatarUrl?.publicId) {
        await deleteFromCloudinary(user?.avatarUrl?.publicId);
      }

      // 4. update user avatar in db
      const updatedResult = await userModel.findByIdAndUpdate(
        user.userId,
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
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/users/profile');
      }

      req.flash('success', 'Avatar updated successfully');
      return res.redirect('/users/profile');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/profile');
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

  async updateUserProfileHandler(
    req: Request<object, object, TUserUpdateProfileDTO>,
    res: Response,
  ) {
    try {
      Logger.info('Updating user profile...');
      const userId = req.user?.userId;

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

      req.flash('success', 'Profile updated successfully');
      return res.redirect('/users/profile');
    } catch (error) {
      Logger.error((error as Error).message);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/profile');
    }
  }

  async renderUserChangePasswordPage(req: Request, res: Response) {
    try {
      Logger.info('Getting user change password page...');

      return res.render('users/auth/change-password', {
        title: 'User | Change Password',
        pageTitle: 'User Change Password',
      });
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/auth/profile');
    }
  }

  async userChangePasswordHandler(req: Request, res: Response) {
    try {
      Logger.info(`Update user password route called`);

      const userId = req.user?.userId;

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate userId
      if (!userId) {
        Logger.error('UserId not provided');
        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/users/profile');
      }

      // 1.Find user with userId
      const user = await userModel.findById(userId).select('+passwordHash');
      if (!user) {
        Logger.error('User not found in db');
        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/users/auth/login');
      }

      // 2.Compare newPassword and comparePassword
      if (newPassword !== confirmPassword) {
        Logger.error('Passwords do not match');
        req.flash('error', 'Passwords do not match');
        return res.redirect('/users/profile/change-password');
      }

      // 3. Check password
      const isPasswordMatch = await authHelper.comparePasswordHelper(
        currentPassword,
        user.passwordHash,
      );
      if (!isPasswordMatch) {
        Logger.error('Password is incorrect');
        req.flash('Please enter correct password');
        return res.redirect('/users/profile/change-password');
      }

      // 4. Hash password
      const newPasswordHash = await authHelper.hashPasswordHelper(newPassword);
      if (!newPasswordHash) {
        Logger.error('Hashing password failed');
        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/users/profile/change-password');
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
        Logger.error('Updating password failed');
        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/users/profile/change-password');
      }

      // 6. Remove refresh token
      const deletedRefreshTokenRecord = await refreshTokenModel.deleteMany({
        userId,
      });
      if (!deletedRefreshTokenRecord) {
        Logger.error('Deleting refresh token record failed');
        req.flash('error', 'Some error occurred please try again');
        return res.redirect('/users/profile');
      }

      req.flash('success', 'Password updated successfully');
      return res.redirect('/users/auth/login');
    } catch (error) {
      Logger.error(`${(error as Error).message}`);
      req.flash('error', (error as Error).message);
      return res.redirect('/users/profile/change-password');
    }
  }
}

export default new UserProfileController();
