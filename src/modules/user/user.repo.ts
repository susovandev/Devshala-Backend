import { type IGetUserParams, type ICreateUserParams, sendUserInformation } from './user.types.js';
import userModel, { UserRole } from 'models/user.model.js';
import userProfileModel from 'models/profile.model.js';
import Logger from '@config/logger.js';
import mongoose from 'mongoose';
import { UnauthorizedError } from '@libs/errors.js';
class UserRepo {
  async getProfileByUserId(userId: string) {
    Logger.debug('Getting user profile...');
    const userProfile = await userModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
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
    ]);
    if (!userProfile.length) {
      throw new UnauthorizedError('User profile not found');
    }

    return sendUserInformation(userProfile[0]);
  }
  async getByUserId(userId: string) {
    Logger.debug('Getting user by id...');
    const user = await userModel.findById(userId).select('-passwordHash');
    return user;
  }
  async getUserByUsernameOrEmail(params: Partial<IGetUserParams>) {
    Logger.debug('Getting user by username or email...');
    const { username, email } = params;
    const user = await userModel
      .findOne({
        $or: [{ username }, { email }],
      })
      .select('+passwordHash');
    return user;
  }
  async createUser(params: ICreateUserParams) {
    Logger.debug('Creating user...');
    const user = await userModel.create({
      ...params,
      role: UserRole.USER,
    });
    return user;
  }

  async markEmailAsVerified(userId: string) {
    return await userModel.findByIdAndUpdate(userId, { isEmailVerified: true }, { new: true });
  }

  async resetPassword(params: { userId: string; passwordHash: string }) {
    Logger.debug('Reset password...');
    const { userId, passwordHash } = params;
    return await userModel.findByIdAndUpdate(userId, { passwordHash }, { new: true });
  }

  async createUserProfile(userId: string) {
    Logger.debug('Creating user profile...');
    return await userProfileModel.create({ userId });
  }
}

export default new UserRepo();
