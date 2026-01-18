import userModel, { UserRole } from 'models/user.model.js';
import { TCreatePublisherRequestBody } from './admin.validations.js';
import Logger from '@config/logger.js';
class AdminRepo {
  async findPublisher(params: TCreatePublisherRequestBody) {
    Logger.debug('Finding publisher...');
    const { username, email } = params;

    return userModel.findOne({
      $or: [{ username }, { email }],
      isBlocked: false,
      isDisabled: false,
      isDeleted: false,
    });
  }
  async updateRole(userId: string, role: UserRole) {
    Logger.debug('Updating user role...');
    return await userModel.findByIdAndUpdate(userId, { role }, { new: true });
  }

  async createPublisher(params: {
    adminId: string;
    username: string;
    email: string;
    passwordHash: string;
  }) {
    Logger.debug('Creating publisher...');
    const { adminId, username, email, passwordHash } = params;
    return await userModel.create({
      username,
      email,
      passwordHash,
      role: UserRole.PUBLISHER,
      isEmailVerified: true,
      mustChangePassword: true,
      createdBy: adminId,
    });
  }
}

export default new AdminRepo();
