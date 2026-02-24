import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import { sendEmailService } from 'mail/index.js';
import emailModel, { EmailStatus } from 'models/email.model.js';
import { sendPublisherCredentialsMailTemplate } from 'mail/templates/admin/publisherCredentials.template.js';
import { env } from '@config/env.js';
import notificationModel from 'models/notification.model.js';
class AdminPublisherController {
  async getPublisherPage(req: Request, res: Response) {
    try {
      Logger.info('Getting publisher page...');

      if (!req.user) {
        Logger.error('Admin not found');
        req.flash('error', 'Admin not found please try again');
        return res.redirect('/admin/auth/login');
      }

      const publishers = await userModel.find({
        role: UserRole.PUBLISHER,
        isDeleted: false,
      });
      if (!publishers.length) {
        Logger.error('No publisher found');
        req.flash('error', 'No publisher found');
        return res.redirect('/admin/dashboard');
      }

      // Get notifications
      const notifications = await notificationModel
        .find({
          recipientId: req.user._id,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      const totalNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: req.user._id,
        isRead: false,
      });

      return res.render('admin/publishers', {
        title: 'Admin | Publishers',
        pageTitle: 'Manage Publishers',
        currentPath: '/admins/publishers',
        admin: req.user,
        publishers,
        notifications: notifications,
        totalNotifications,
        totalUnreadNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/publishers');
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
        await user.save({ validateBeforeSave: true });

        // TODO: SEND EMAIL TO USER
        req.flash('success', 'Publisher role updated successfully');
        return res.redirect('/admin/publishers');
      }

      // Generate verification code
      const randomStrongPassword = authHelper.generateStrongRandomPassword();
      if (!randomStrongPassword) {
        Logger.warn('Generating random strong password failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/publishers');
      }

      // Hash password
      const hashPassword = await authHelper.hashPasswordHelper(randomStrongPassword);
      if (!hashPassword) {
        Logger.warn('Hashing password failed');

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
        createdBy: req.user?._id,
        status: UserStatus.ACTIVE,
      });

      if (!publisher) {
        Logger.warn('Creating publisher failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/publishers');
      }

      // store email record
      const emailRecord = await emailModel.create({
        recipient: publisher._id,
        recipientEmail: publisher.email,
        subject: 'Your credentials',
        body: sendPublisherCredentialsMailTemplate({
          appName: 'Devshala',
          publisherName: publisher.username,
          email,
          password: randomStrongPassword,
          loginUrl: `${env.BASE_URL}/publishers/auth/login`,
          year: new Date().getFullYear(),
          supportEmail: env.SUPPORT_EMAIL as string,
        }),
        source: UserRole.PUBLISHER,
        sendAt: new Date(Date.now()),
        status: EmailStatus.PENDING,
      });
      if (!emailRecord) {
        Logger.warn('Creating publisher failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/admin/publishers');
      }

      // Send credentials to publisher email
      await sendEmailService({
        recipient: emailRecord.recipientEmail,
        subject: emailRecord.subject,
        htmlTemplate: emailRecord.body,
        sender: req.user?.email,
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
  async blockPublisherAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Blocking user account...');

      const userId = req.params.id;
      if (!userId) {
        Logger.error('User id not found');
        req.flash('error', 'User id not found');
        return res.redirect('/admin/publishers');
      }

      const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
        role: UserRole.PUBLISHER,
      });
      if (!user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admin/publishers');
      }

      // check if user is already blocked
      if (user.status !== UserStatus.ACTIVE) {
        Logger.error('User is already blocked');
        req.flash('error', 'Publisher is already blocked or disabled');
        return res.redirect('/admin/publishers');
      }

      await userModel.updateOne(
        { _id: userId },
        {
          $set: {
            status: UserStatus.BLOCKED,
          },
        },
      );

      req.flash('success', 'Publisher blocked successfully');
      return res.redirect('/admin/publishers');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/publishers');
    }
  }
  async activePublisherAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Activating Publisher account...');

      const userId = req.params.id;
      if (!userId) {
        Logger.error('User id not found');
        req.flash('error', 'User id not found');
        return res.redirect('/admin/publishers');
      }

      const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
        role: UserRole.PUBLISHER,
      });
      if (!user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admin/publishers');
      }

      // check if user is already active
      if (user.status === UserStatus.ACTIVE) {
        Logger.error('User is already ACTIVE');
        req.flash('error', 'User is already ACTIVE');
        return res.redirect('/admin/publishers');
      }

      await userModel.updateOne(
        { _id: userId },
        {
          $set: {
            status: UserStatus.ACTIVE,
          },
        },
      );

      req.flash('success', 'User activated successfully');
      return res.redirect('/admin/publishers');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/publishers');
    }
  }
  async disablePublisherAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Disabling user account...');

      const userId = req.params.id;
      if (!userId) {
        Logger.error('User id not found');
        req.flash('error', 'User id not found');
        return res.redirect('/admin/publishers');
      }

      const user = await userModel.findOne({
        _id: userId,
        isDeleted: false,
        role: UserRole.PUBLISHER,
      });
      if (!user) {
        Logger.error('User not found');
        req.flash('error', 'User not found please try again');
        return res.redirect('/admin/publishers');
      }

      // check if user is already disabled or active
      if (user.status === UserStatus.DISABLED || user.status === UserStatus.BLOCKED) {
        Logger.error('User is already ACTIVE');
        req.flash('error', 'User is already DISABLED or BLOCKED');
        return res.redirect('/admin/publishers');
      }

      await userModel.updateOne(
        { _id: userId },
        {
          $set: {
            status: UserStatus.DISABLED,
          },
        },
      );

      req.flash('success', 'Publisher disabled successfully');
      return res.redirect('/admin/publishers');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/admin/publishers');
    }
  }
}

export default new AdminPublisherController();
