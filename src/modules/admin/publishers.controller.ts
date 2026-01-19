import { env } from '@config/env.js';
import Logger from '@config/logger.js';
import authHelper from '@modules/auth/auth.helper.js';
import type { Request, Response } from 'express';
import { sendEmailService } from 'mail/index.js';
import { sendPublisherCredentialsMailTemplate } from 'mail/templates/admin/publisherCredentials.template.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
class AdminPublisherController {
  async getPublishersPage(req: Request, res: Response) {
    try {
      const publishers = await userModel
        .find({ role: UserRole.PUBLISHER, isDeleted: false })
        .sort({ createdAt: -1 })
        .select({
          _id: 1,
          username: 1,
          email: 1,
          status: 1,
          avatarUrl: 1,
        })
        .lean();

      // Check if publisher found
      if (!publishers.length) {
        Logger.error('No publisher found');
        req.flash('error', 'No publisher found');
        return res.redirect('/admin/dashboard');
      }

      return res.render('admin/publishers/publishers', {
        title: 'Admin | Publishers',
        pageTitle: 'Publishers',
        notificationsCount: 3,
        admin: {
          username: req.user?.username,
          email: req.user?.email,
          avatar:
            req.user?.avatarUrl?.url ??
            `https://ui-avatars.com/api/?name=${req.user?.username}&background=random&color=7FF8FF&length=1`,
          role: req.user?.role,
        },
        publishers,
      });
    } catch (error) {
      Logger.error(error);
      req.flash('error', (error as Error).message);
      return res.redirect('/admin/dashboard');
    }
  }

  async createPublisherHandler(req: Request, res: Response) {
    try {
      Logger.info(`Create publisher route called with data: ${JSON.stringify(req.body)}`);

      const { username, email } = req.body;

      const normalizedEmail = email.trim().toLowerCase();

      // Find user by username and email
      const user = await userModel.findOne({
        $or: [{ username }, { email: normalizedEmail }],
      });

      // Check if user already exists in
      if (user) {
        if (user.role === UserRole.PUBLISHER) {
          Logger.error('You already have a publisher account');
          req.flash('error', 'You already have a publisher account');
          return res.redirect('/admin/publishers');
        }
        if (user.status !== UserStatus.ACTIVE) {
          Logger.error('Publisher account is not active');
          req.flash('error', 'Your account is not active');
          return res.redirect('/admin/publishers');
        }
        if (user.isDeleted) {
          Logger.error('Your account is deleted');
          req.flash('error', 'Your account is deleted');
          return res.redirect('/admin/publishers');
        }

        // Update role
        user.role = UserRole.PUBLISHER;
        await user.save();

        // TODO: SEND EMAIL TO USER
        req.flash('success', 'Publisher role updated successfully');
        return res.redirect('/admin/publishers');
      }

      // Generate verification code
      const randomStrongPassword = authHelper.generateStrongRandomPassword();
      if (!randomStrongPassword) {
        Logger.error('Generating random strong password failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/publishers');
      }

      // Hash password
      const hashPassword = await authHelper.hashPasswordHelper(randomStrongPassword);
      if (!hashPassword) {
        Logger.error('Hashing password failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/publishers');
      }

      // Create new publisher in DB
      const publisher = await userModel.create({
        username,
        email: normalizedEmail,
        passwordHash: hashPassword,
        role: UserRole.PUBLISHER,
        isEmailVerified: true,
        mustChangePassword: true,
        createdBy: req.user?.userId,
        status: UserStatus.ACTIVE,
      });

      if (!publisher) {
        Logger.error('Creating publisher failed');
        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/publishers');
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
          loginUrl: `${env.BASE_URL}/publishers/auth/login`,
          year: new Date().getFullYear(),
          supportEmail: env.SUPPORT_EMAIL,
        }),
      });

      req.flash(
        'success',
        'Publisher created successfully and credentials sent to publisher email',
      );
      return res.redirect('/admin/publishers');
    } catch (error) {
      req.flash('error', (error as Error).message);
      return res.redirect('/admin/publishers');
    }
  }
}

export default new AdminPublisherController();
