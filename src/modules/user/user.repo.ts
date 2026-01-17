import type { IGetUserParams, ICreateUserParams } from './user.types.js';
import userModel, { UserRole } from 'models/user.model.js';
import Logger from '@config/logger.js';
class UserRepo {
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
}

export default new UserRepo();
