import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import { sendEmailService } from 'mail/index.js';
import emailModel, { EmailStatus } from 'models/email.model.js';
import { sendPublisherCredentialsMailTemplate } from 'mail/templates/admin/publisherCredentials.template.js';
import { env } from '@config/env.js';
import notificationModel from 'models/notification.model.js';
class PublisherAuthorController {
  async getAuthorsPage(req: Request, res: Response) {
    try {
      Logger.info('Getting authors page...');

      if (!req.user) {
        Logger.warn('Publisher not found');

        req.flash('error', 'Publisher not found please try again');
        return res.redirect('/publishers/auth/login');
      }

      const publisherId = req.user._id;

      const page = Number(req.query.page) || 1;
      const limit = 8;

      const options = {
        page,
        limit,
      };

      const authors = await userModel.paginate(
        {
          role: UserRole.AUTHOR,
          isDeleted: false,
        },
        options,
      );

      // Get notifications
      const notifications = await notificationModel
        .find({
          recipientId: publisherId,
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      const totalNotifications = await notificationModel.find({
        recipientId: publisherId,
      });

      const totalUnreadNotifications = await notificationModel.countDocuments({
        recipientId: publisherId,
        isRead: false,
      });

      return res.render('publishers/authors', {
        title: 'Publisher | Authors',
        pageTitle: 'Publisher Authors',
        currentPath: '/publishers/author/manage',
        publisher: req.user,
        authors,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/author/manage');
    }
  }
  async createAuthorHandler(req: Request, res: Response) {
    try {
      Logger.info(`Create Author route called with data: ${JSON.stringify(req.body)}`);

      const { username, email } = req.body;

      const normalizedEmail = email.trim().toLowerCase();

      // Find user by username and email
      const user = await userModel.findOne({
        $or: [{ username }, { email: normalizedEmail }],
        role: { $ne: UserRole.ADMIN },
      });

      // Check if user already exists in
      if (user) {
        if (user.role === UserRole.AUTHOR) {
          Logger.warn('Already have a author account');

          req.flash('error', 'Already have a author account');
          return res.redirect('/publishers/author/manage');
        }
        if (user.status !== UserStatus.ACTIVE) {
          Logger.warn('Author account is not active');

          req.flash('error', 'Author account is not active');
          return res.redirect('/publishers/author/manage');
        }
        if (user.isDeleted) {
          Logger.warn('Author account is already deleted');

          req.flash('error', 'Author account is already deleted');
          return res.redirect('/publishers/author/manage');
        }

        // Update role
        user.role = UserRole.AUTHOR;
        await user.save({ validateBeforeSave: true });

        // TODO: SEND EMAIL TO USER
        req.flash('success', 'Author role updated successfully');
        return res.redirect('/publishers/author/manage');
      }

      // Generate verification code
      const randomStrongPassword = authHelper.generateStrongRandomPassword();
      if (!randomStrongPassword) {
        Logger.warn('Generating random strong password failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/author/manage');
      }

      // Hash password
      const hashPassword = await authHelper.hashPasswordHelper(randomStrongPassword);
      if (!hashPassword) {
        Logger.warn('Hashing password failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/author/manage');
      }

      // Create new author in DB
      const author = await userModel.create({
        username,
        email: normalizedEmail,
        passwordHash: hashPassword,
        role: UserRole.AUTHOR,
        isEmailVerified: true,
        mustChangePassword: true,
        createdBy: req.user?._id,
        status: UserStatus.ACTIVE,
      });

      if (!author) {
        Logger.warn('Creating Author failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/author/manage');
      }

      // store email record
      const emailRecord = await emailModel.create({
        recipient: author._id,
        recipientEmail: author.email,
        subject: 'Your credentials',
        body: sendPublisherCredentialsMailTemplate({
          appName: 'Devshala',
          publisherName: author.username,
          email,
          password: randomStrongPassword,
          loginUrl: `${env.BASE_URL}/authors/auth/login`,
          year: new Date().getFullYear(),
          supportEmail: env.SUPPORT_EMAIL,
        }),
        source: UserRole.PUBLISHER,
        sendAt: new Date(Date.now()),
        status: EmailStatus.PENDING,
      });
      if (!emailRecord) {
        Logger.warn('Creating Author failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/author/manage');
      }

      // Send credentials to publisher email
      await sendEmailService({
        recipient: emailRecord.recipientEmail,
        subject: emailRecord.subject,
        htmlTemplate: emailRecord.body,
        sender: req.user?.email,
      });

      req.flash('success', 'Author created successfully and credentials sent to author email');
      return res.redirect('/publishers/author/manage');
    } catch (error) {
      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/author/manage');
    }
  }
  async blockAuthorAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Blocking Author account...');

      //1. Get authorId from the params
      const authorId = req.params.id;
      if (!authorId) {
        Logger.warn('Author id not found');

        req.flash('error', 'Author id not found');
        return res.redirect('/publishers/author/manage');
      }

      //2. Check if author exists in DB
      const author = await userModel.findOne({
        _id: authorId,
        isDeleted: false,
        role: UserRole.AUTHOR,
      });
      if (!author) {
        Logger.warn('Author not found');

        req.flash('error', 'Author not found please try again');
        return res.redirect('/publishers/author/manage');
      }

      //3. check if user is already blocked or disabled
      if (author.status !== UserStatus.ACTIVE) {
        Logger.warn('User is already blocked or disabled');

        req.flash('error', 'Author is already blocked or disabled');
        return res.redirect('/publishers/author/manage');
      }

      const blockedAuthor = await userModel.findOneAndUpdate(
        { _id: authorId, isDeleted: false, role: UserRole.AUTHOR },
        {
          status: UserStatus.BLOCKED,
          blockedAt: new Date(),
          blockedBy: req.user?._id,
          blockedReason: req.body.reason,
        },
      );

      if (!blockedAuthor) {
        Logger.warn('Blocking Author failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/author/manage');
      }
      // TODO: SEND EMAIL TO USER

      req.flash('success', 'Author blocked successfully');
      return res.redirect('/publishers/author/manage');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/author/manage');
    }
  }
  async activeAuthorAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Activating Author account...');

      //1. Get authorId from the params
      const authorId = req.params.id;
      if (!authorId) {
        Logger.warn('Author id not found');

        req.flash('error', 'Author id not found');
        return res.redirect('/publishers/author/manage');
      }

      //2. Check already exists in DB
      const author = await userModel.findOne({
        _id: authorId,
        isDeleted: false,
        role: UserRole.AUTHOR,
      });
      if (!author) {
        Logger.warn('Author not found');

        req.flash('error', 'Author not found please try again');
        return res.redirect('/publishers/author/manage');
      }

      // check if user is already active
      if (author.status === UserStatus.ACTIVE) {
        Logger.warn('Author is already ACTIVE');

        req.flash('error', 'Author is already ACTIVE');
        return res.redirect('/publishers/author/manage');
      }

      const activatedAuthor = await userModel.findOneAndUpdate(
        { _id: authorId },
        {
          status: UserStatus.ACTIVE,
          enabledAt: new Date(),
          enabledBy: req.user?._id,
        },
      );

      if (!activatedAuthor) {
        Logger.warn('Activating Author failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/author/manage');
      }

      req.flash('success', 'Author activated successfully');
      return res.redirect('/publishers/author/manage');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/author/manage');
    }
  }
  async disableAuthorAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Disabling author account...');

      // Get authorId from the params
      const authorId = req.params.id;
      if (!authorId) {
        Logger.error('Author id not found');

        req.flash('error', 'Author id not found');
        return res.redirect('/publishers/author/manage');
      }

      // Check already exists in DB
      const author = await userModel.findOne({
        _id: authorId,
        isDeleted: false,
        role: UserRole.AUTHOR,
      });
      if (!author) {
        Logger.error('Author not found');

        req.flash('error', 'Author not found please try again');
        return res.redirect('/publishers/author/manage');
      }

      // check if user is already disabled or active
      if (author.status !== UserStatus.ACTIVE) {
        Logger.warn('Author is already ACTIVE');

        req.flash('error', 'Author is already DISABLED or BLOCKED');
        return res.redirect('/publishers/authors');
      }

      const disabledAuthor = await userModel.findOneAndUpdate(
        { _id: authorId },
        {
          status: UserStatus.DISABLED,
          disabledAt: new Date(),
          disabledBy: req.user?._id,
          disabledReason: req.body.reason,
        },
      );
      if (!disabledAuthor) {
        Logger.warn('Disabling Author failed');

        req.flash('error', 'Something went wrong please try again');
        return res.redirect('/publishers/author/manage');
      }

      // TODO: SEND EMAIL TO USER
      req.flash('success', 'Author disabled successfully');
      return res.redirect('/publishers/author/manage');
    } catch (error) {
      Logger.warn(`${(error as Error).message}`);

      req.flash('error', (error as Error).message);
      return res.redirect('/publishers/author/manage');
    }
  }
}

export default new PublisherAuthorController();
