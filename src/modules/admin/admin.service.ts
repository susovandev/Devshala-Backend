import Logger from '@config/logger.js';
import { TCreatePublisherRequestBody } from './admin.validations.js';
import { IUserDocument, UserRole } from 'models/user.model.js';
import adminRepo from './admin.repo.js';
import authHelper from '@modules/auth/auth.helper.js';
import { ConflictError, InternalServerError } from '@libs/errors.js';
import { sendEmailService } from 'mail/index.js';
import { sendPublisherCredentialsMailTemplate } from 'mail/templates/admin/publisherCredentials.template.js';
import { env } from '@config/env.js';

class AdminService {
  async createPublisherService(adminId: string, params: TCreatePublisherRequestBody) {
    Logger.debug('Creating publisher...');

    const { username, email } = params;
    const normalizedEmail = email.trim().toLowerCase();

    let user: IUserDocument | null = null;

    // Check user is already exits in db
    const isAlreadyExists = await adminRepo.findPublisher({
      username,
      email: normalizedEmail,
    });

    if (isAlreadyExists && isAlreadyExists.role === UserRole.PUBLISHER) {
      Logger.info('User already exists');
      throw new ConflictError('You already have a publisher account');
    }

    if (isAlreadyExists && isAlreadyExists.role !== UserRole.PUBLISHER) {
      Logger.info('User already exists');
      // Update role
      user = await adminRepo.updateRole(isAlreadyExists._id.toString(), UserRole.PUBLISHER);
    }

    // Generate a random strong password
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

    // Store user in DB
    user = await adminRepo.createPublisher({
      username,
      email: normalizedEmail,
      passwordHash: hashPassword,
      adminId,
    });
    if (!user) {
      Logger.error('Creating publisher failed');
      throw new InternalServerError('Creating publisher failed');
    }

    // Send credentials to user
    await sendEmailService({
      recipient: normalizedEmail,
      subject: 'Your credentials',
      htmlTemplate: sendPublisherCredentialsMailTemplate({
        appName: 'Devshala',
        publisherName: username,
        email,
        password: randomStrongPassword,
        loginUrl: `${env.CLIENT_DEVELOPMENT_URL}/auth/signin`,
        year: new Date().getFullYear(),
        supportEmail: env.SUPPORT_EMAIL,
      }),
    });

    return user;
  }
}

export default new AdminService();
