/*
import fs from 'node:fs/promises';
import type { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import userModel from 'models/user.model.js';
import Logger from '@config/logger.js';
import { ApiResponse } from '@libs/apiResponse.js';
import {
  IUpdateUserPasswordRequestBody,
  IUpdateUserProfileRequestBody,
} from './user.validation.js';
import { AuthRequest } from '@modules/auth/auth.types.js';
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from '@libs/errors.js';
import authHelper from '@modules/auth/auth.helper.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '@libs/cloudinary.js';

class UserController {
  async getUserProfileHandler(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Get user profile route called with data: ${JSON.stringify(req.body)}`);

      const userId = req.user;
      const profile = await userModel
        .findById(userId)
        .select({
          _id: 1,
          username: 1,
          email: 1,
          role: 1,
          isEmailVerified: 1,
          avatarUrl: 1,
          bio: 1,
          socialLinks: 1,
          createdAt: 1,
        })
        .lean();
      if (!profile) {
        Logger.error('');
        throw new NotFoundError('User not found');
      }

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'User profile fetched successfully', profile));
    } catch (error) {
      return next(error);
    }
  }

  async updateUserProfileHandler(
    req: AuthRequest<IUpdateUserProfileRequestBody>,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      Logger.info(`Update user profile route called`);

      const userId = req.user?.userId;
      const { username, bio, github, linkedin, twitter } = req.body;
      const avatarLocalFilePath = req?.file?.path;

      const user = await userModel.findById(userId);
      if (!user) {
        Logger.error();
        throw new NotFoundError('User profile not found');
      }

      const updateFields: Partial<{
        bio: string;
        username: string;
        socialLinks: object;
        avatarUrl: { url: string; publicId: string };
      }> = {
        bio,
        username,
        socialLinks: {
          github,
          linkedin,
          twitter,
        },
      };

      if (avatarLocalFilePath) {
        const { secure_url, public_id } = await uploadOnCloudinary({
          localFilePath: avatarLocalFilePath,
        });

        await fs.unlink(avatarLocalFilePath);

        // delete old avatar
        if (user.avatarUrl?.publicId) {
          await deleteFromCloudinary(user.avatarUrl.publicId);
        }

        updateFields.avatarUrl = {
          url: secure_url,
          publicId: public_id,
        };
      }

      const updatedResult = await userModel.findByIdAndUpdate(user._id, updateFields, {
        new: true,
      });
      if (!updatedResult) {
        Logger.error();
        throw new InternalServerError();
      }

      Logger.debug('Profile updated successfully');
      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'User profile updated successfully'));
    } catch (error) {
      return next(error);
    }
  }

  async updateUserPasswordHandler(
    req: AuthRequest<IUpdateUserPasswordRequestBody>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      Logger.info(`Update user password route called`);

      const userId = req.user?.userId;
      const { oldPassword, newPassword, confirmPassword } = req.body;

      // Find user with userId
      const user = await userModel.findById(userId).select('-passwordHash');
      if (!user) {
        Logger.error();
        throw new NotFoundError('User not found');
      }

      // Compare newPassword and comparePassword
      if (newPassword !== confirmPassword) {
        Logger.error();
        throw new BadRequestError('Passwords do not match');
      }

      // Check password
      const isPasswordMatch = await authHelper.comparePasswordHelper(
        oldPassword,
        user.passwordHash,
      );
      if (!isPasswordMatch) {
        Logger.error();
        throw new ConflictError('Password is incorrect');
      }

      // Hash password
      const newPasswordHash = await authHelper.hashPasswordHelper(newPassword);
      if (!newPasswordHash) {
        Logger.error();
        throw new InternalServerError('Hashing password failed');
      }

      // Update password
      const updatedResult = await userModel.findByIdAndUpdate(
        user?._id,
        {
          passwordHash: newPasswordHash,
        },
        { new: true },
      );
      if (!updatedResult) {
        Logger.error();
        throw new InternalServerError();
      }

      Logger.debug('Updated password successfully');

      return res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, 'Password updated successfully'));
    } catch (error) {
      return next(error);
    }
  }
}

export default new UserController();
*/
