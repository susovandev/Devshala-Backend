import Logger from '@config/logger.js';
import userRepo from './user.repo.js';
import { UnauthorizedError } from '@libs/errors.js';

class UserService {
  async getUserProfileService(userId: string) {
    Logger.debug('Getting user profile...');

    const user = await userRepo.getProfileByUserId(userId);
    if (!user) {
      Logger.error('User profile not found');
      throw new UnauthorizedError('User profile not found');
    }
    return user;
  }
}

export default new UserService();
