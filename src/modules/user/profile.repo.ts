import userProfileModel from 'models/profile.model.js';
import Logger from '@config/logger.js';
import { IUpdateUserProfileParams } from './user.types.js';
import mongoose from 'mongoose';
import userModel from 'models/user.model.js';

class UserProfileRepo {
  async getProfileByUserId(userId: string) {
    Logger.debug('Getting user profile...');
    return await userProfileModel.findOne({ userId });
  }
  async getUserProfile(userId: string) {
    Logger.debug('Getting user profile...');
    const userProfileRecord = await userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          isDisabled: false,
          isBlocked: false,
        },
      },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: '$profile',
      },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          role: 1,
          isEmailVerified: 1,
          profile: {
            avatarUrl: 1,
            bio: 1,
            socialLinks: 1,
          },
        },
      },
    ]);
    return userProfileRecord;
  }

  async createUserProfile(userId: string) {
    Logger.debug('Creating user profile...');
    return await userProfileModel.create({ userId });
  }

  async updateUserProfile(userId: string, params: Partial<IUpdateUserProfileParams>) {
    Logger.debug('Updating user profile...');
    return await userProfileModel.findOneAndUpdate({ userId }, params, { new: true });
  }
}

export default new UserProfileRepo();
