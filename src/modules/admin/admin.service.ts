import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import { ConflictError, InternalServerError } from '@libs/errors.js';
import { sendEmailService } from 'mail/index.js';
import { sendPublisherCredentialsMailTemplate } from 'mail/templates/admin/publisherCredentials.template.js';
import { env } from '@config/env.js';

class AdminService {
  async createPublisherService({
    adminId,
    username,
    email,
  }: {
    adminId: string;
    username: string;
    email: string;
  }) {
    Logger.debug('Creating publisher...');

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by username and email
    const user = await userModel.findOne({
      $or: [{ username }, { email: normalizedEmail }],
    });

    // Check if user already exists in
    if (user) {
      if (user.role === UserRole.PUBLISHER) {
        throw new ConflictError('You already have a publisher account');
      }
      if (user.status !== UserStatus.ACTIVE) {
        throw new ConflictError('Your account is not active');
      }
      if (user.isDeleted) {
        throw new ConflictError('Your account is deleted');
      }

      // Update role
      user.role = UserRole.PUBLISHER;
      await user.save();
    }

    // Generate verification code
    const randomStrongPassword = authHelper.generateStrongRandomPassword();
    if (!randomStrongPassword) {
      Logger.error('Generating random strong password failed');
      throw new InternalServerError('Generating random strong password failed');
    }

    // Hash password
    const hashPassword = await authHelper.hashPasswordHelper(randomStrongPassword);
    if (!hashPassword) {
      Logger.error('Hashing password failed');
      throw new InternalServerError('Hashing password failed');
    }

    // Create new publisher in DB
    const publisher = await userModel.create({
      username,
      email: normalizedEmail,
      passwordHash: hashPassword,
      role: UserRole.PUBLISHER,
      isEmailVerified: true,
      mustChangePassword: true,
      createdBy: adminId,
      status: UserStatus.ACTIVE,
    });

    if (!publisher) {
      Logger.error('Creating publisher failed');
      throw new InternalServerError('Creating publisher failed');
    }

    // Send credentials to publisher email
    await sendEmailService({
      recipient: publisher.email,
      subject: 'Your credentials',
      htmlTemplate: sendPublisherCredentialsMailTemplate({
        appName: 'Devshala',
        publisherName: publisher.username,
        email,
        password: randomStrongPassword,
        loginUrl: `${env.CLIENT_DEVELOPMENT_URL}/auth/signin`,
        year: new Date().getFullYear(),
        supportEmail: env.SUPPORT_EMAIL,
      }),
    });
    return user;
  }

  async blockUserService({
    adminId,
    userId,
    reason,
  }: {
    adminId: string;
    userId: string;
    reason: string;
  }) {
    Logger.debug('Blocking user...');
    const user = await userModel.findOne({
      _id: userId,
      isDeleted: false,
    });

    // Check if user exists
    if (!user) {
      Logger.error(`User not found with id: ${userId}`);
      throw new ConflictError('User not found');
    }

    // Check is user already blocked or disabled
    if (user.status === UserStatus.DISABLED || user.status === UserStatus.BLOCKED) {
      throw new ConflictError('User is already blocked or disabled');
    }

    // Block user
    const blockedUser = await userModel.findByIdAndUpdate(
      { _id: user._id },
      {
        $set: {
          status: UserStatus.BLOCKED,
          blockedAt: new Date(),
          blockedReason: reason,
          blockedBy: adminId,
        },
      },
      { new: true },
    );

    if (!blockedUser) {
      Logger.error('Blocking user failed');
      throw new InternalServerError('Blocking user failed');
    }

    //TODO SEND BLOCK USER EMAIL
    return;
  }

  async unblockUserService({ adminId, userId }: { adminId: string; userId: string }) {
    Logger.debug('Unblocking user...');
    const user = await userModel.findOne({
      _id: userId,
      isDeleted: false,
      status: UserStatus.BLOCKED,
    });

    // Check if user exists
    if (!user) {
      Logger.error(`User not found with id: ${userId}`);
      throw new ConflictError('User not found or not blocked');
    }

    // Unblock user
    const unblockedUser = await userModel.findByIdAndUpdate(
      { _id: user._id },
      {
        $set: {
          status: UserStatus.ACTIVE,
          unblockedAt: new Date(),
          unblockedBy: adminId,
        },
      },
      { new: true },
    );

    if (!unblockedUser) {
      Logger.error('Unblocking user failed');
      throw new InternalServerError('Unblocking user failed');
    }

    //TODO SEND UNBLOCK USER EMAIL
    return;
  }
}

export default new AdminService();
