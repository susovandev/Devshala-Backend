import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';
import authHelper from '@modules/auth/auth.helper.js';
import emailModel, { EmailSource, EmailType } from 'models/email.model.js';
import { sendPublisherCredentialsMailTemplate } from 'mail/templates/admin/publisherCredentials.template.js';
import { env } from '@config/env.js';
import notificationModel from 'models/notification.model.js';
import { sendEmailQueue } from 'queues/sendEmail.queue.js';
import WelcomeAuthorTemplate from 'mail/templates/author/welcome.template.js';
import BlockAuthorAccountTemplate from 'mail/templates/author/block-request.template.js';
import accountActivateTemplate from 'mail/templates/author/activate-request.template.js';
import accountDisableTemplate from 'mail/templates/author/disable-request.template.js';
class PublisherAuthorController {
  async getAuthorsPage(req: Request, res: Response) {
    try {
      Logger.info('Getting authors page...');

      const publisherId = req?.user?._id;

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
          createdBy: publisherId,
        },
        options,
      );

      /**
       * Get notifications
       * Count total notifications
       * Count total unread notifications
       */
      const [notifications, totalNotifications, totalUnreadNotifications] = await Promise.all([
        notificationModel
          .find({ recipientId: publisherId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        notificationModel.countDocuments({ recipientId: publisherId }),
        notificationModel.countDocuments({ recipientId: publisherId, isRead: false }),
      ]);

      return res.render('publishers/authors', {
        title: 'Publisher | Authors',
        pageTitle: 'Publisher Authors',
        currentPath: '/publishers/author/manage',
        publisher: req?.user,
        authors,
        notifications,
        totalUnreadNotifications,
        totalNotifications,
      });
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
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
        role: {
          $nin: [UserRole.PUBLISHER, UserRole.ADMIN],
        },
        isDeleted: false,
      });

      // Check if user already exists in
      if (user) {
        if (user.role === UserRole.AUTHOR) {
          throw new Error('Already have a author account');
        }
        if (user.status !== UserStatus.ACTIVE) {
          throw new Error('Author account is not active');
        }

        // Update role
        user.role = UserRole.AUTHOR;
        user.createdBy = req.user?._id;
        await user.save({ validateBeforeSave: true });

        // TODO: SEND EMAIL TO USER
        const emailRecord = await emailModel.create({
          recipient: user?._id,
          recipientEmail: user?.email,
          subject: 'You are added as author on Devshala',
          type: EmailType.AUTHOR_ACCOUNT_CREATED,
          source: EmailSource.PUBLISHER,
          body: WelcomeAuthorTemplate({
            dashboard_url: `${env.BASE_URL}/authors/auth/login`,
          }),
        });

        // TODO: SEND EMAIL TO USER : BULL MQ
        await sendEmailQueue.add('send-email', {
          emailId: emailRecord._id.toString(),
        });

        req.flash('success', 'Author role updated successfully');
        return res.redirect('/publishers/author/manage');
      }

      // Generate verification code
      const randomStrongPassword = authHelper.generateStrongRandomPassword();
      if (!randomStrongPassword) {
        Logger.warn('Generating random strong password failed');
        throw new Error('Something went wrong please try again');
      }

      // Hash password
      const hashPassword = await authHelper.hashPasswordHelper(randomStrongPassword);
      if (!hashPassword) {
        Logger.warn('Hashing password failed');
        throw new Error('Something went wrong please try again');
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

      // store email record
      const emailRecord = await emailModel.create({
        recipient: author._id,
        recipientEmail: author.email,
        subject: 'You are added as author on Devshala',
        type: EmailType.AUTHOR_ACCOUNT_CREATED,
        source: EmailSource.PUBLISHER,
        body: sendPublisherCredentialsMailTemplate({
          appName: 'Devshala',
          publisherName: author.username,
          email,
          password: randomStrongPassword,
          loginUrl: `${env.BASE_URL}/authors/auth/login`,
          year: new Date().getFullYear(),
          supportEmail: env.SUPPORT_EMAIL as string,
        }),
      });

      // TODO: SEND EMAIL TO USER : BULL MQ
      await sendEmailQueue.add('send-email', {
        emailId: emailRecord._id.toString(),
      });

      req.flash('success', 'Author created successfully and credentials sent to author email');
      return res.redirect('/publishers/author/manage');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/author/manage');
    }
  }

  async blockAuthorAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Blocking Author account...');

      const authorId = req.params?.id;

      const author = await userModel.findOne({
        _id: authorId,
        isDeleted: false,
        role: UserRole.AUTHOR,
        createdBy: req.user?._id,
      });
      if (!author) {
        throw new Error('Author not found please try again');
      }

      //3. check if user is already blocked or disabled
      if (author.status !== UserStatus.ACTIVE) {
        throw new Error('Author is already blocked or disabled');
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
        throw new Error('Blocking Author failed, Please try again');
      }

      // TODO: SEND EMAIL TO USER: BULL MQ
      const emailRecord = await emailModel.create({
        recipient: author._id,
        recipientEmail: author.email,
        subject: 'Account blocked',
        type: EmailType.ACCOUNT_BLOCKED,
        source: EmailSource.PUBLISHER,
        body: BlockAuthorAccountTemplate({
          author_name: author?.username,
          block_reason: req?.body?.reason,
        }),
      });

      // TODO: SEND EMAIL TO USER : BULL MQ
      await sendEmailQueue.add('send-email', {
        emailId: emailRecord._id.toString(),
      });

      req.flash('success', 'Author blocked successfully');
      return res.redirect('/publishers/author/manage');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/author/manage');
    }
  }

  async activeAuthorAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Activating Author account...');

      //1. Get authorId from the params
      const authorId = req.params.id;

      //2. Check already exists in DB
      const author = await userModel.findOne({
        _id: authorId,
        isDeleted: false,
        role: UserRole.AUTHOR,
      });
      if (!author) {
        throw new Error('Author not found please try again');
      }

      // check if user is already active
      if (author.status === UserStatus.ACTIVE) {
        throw new Error('Author is already ACTIVE');
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
        throw new Error('Activating Author failed');
      }

      // TODO: SEND EMAIL TO USER: BULL MQ
      const emailRecord = await emailModel.create({
        recipient: author?._id,
        recipientEmail: author?.email,
        subject: 'Account Activated',
        type: EmailType.ACCOUNT_ACTIVATED,
        source: EmailSource.PUBLISHER,
        body: accountActivateTemplate({
          username: author?.username,
          login_url: `${env.BASE_URL}/authors/auth/login`,
        }),
      });

      // TODO: SEND EMAIL TO USER : BULL MQ
      await sendEmailQueue.add('send-email', {
        emailId: emailRecord._id.toString(),
      });

      req.flash('success', 'Author activated successfully');
      return res.redirect('/publishers/author/manage');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/author/manage');
    }
  }
  async disableAuthorAccountHandler(req: Request, res: Response) {
    try {
      Logger.info('Disabling author account...');

      // Get authorId from the params
      const authorId = req.params?.id;

      // Check already exists in DB
      const author = await userModel.findOne({
        _id: authorId,
        isDeleted: false,
        role: UserRole.AUTHOR,
      });
      if (!author) {
        throw new Error('Author not found please try again');
      }

      // check if user is already disabled or activ
      if (author.status !== UserStatus.ACTIVE) {
        throw new Error('Author is already DISABLED or BLOCKED');
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
        throw new Error('Disabling Author failed');
      }

      // TODO: SEND EMAIL TO USER: BULL MQ
      const emailRecord = await emailModel.create({
        recipient: author._id,
        recipientEmail: author.email,
        subject: 'Account disabled',
        type: EmailType.ACCOUNT_DISABLED,
        source: EmailSource.PUBLISHER,
        body: accountDisableTemplate({
          reason: req?.body?.reason,
          username: author?.username,
        }),
      });

      // TODO: SEND EMAIL TO USER : BULL MQ
      await sendEmailQueue.add('send-email', {
        emailId: emailRecord._id.toString(),
      });

      req.flash('success', 'Author disabled successfully');
      return res.redirect('/publishers/author/manage');
    } catch (error: any) {
      Logger.error(error.message);
      req.flash('error', error.message);
      return res.redirect('/publishers/author/manage');
    }
  }
}

export default new PublisherAuthorController();
