import type { Request, Response } from 'express';
import Logger from '@config/logger.js';
import userModel, { UserRole, UserStatus } from 'models/user.model.js';

class AdminUserController {
  async getUsersPage(req: Request, res: Response) {
    try {
      const users = await userModel.aggregate([
        // 1️⃣ Only publishers
        {
          $match: {
            isDeleted: false,
            role: {
              $ne: {
                $or: [UserRole.ADMIN, UserRole.PUBLISHER],
              },
            },
          },
        },

        // 2️⃣ Join profile
        {
          $lookup: {
            from: 'userprofiles', // collection name (IMPORTANT)
            localField: '_id',
            foreignField: 'userId',
            as: 'profile',
          },
        },

        // 3️⃣ Convert profile array → object
        {
          $unwind: {
            path: '$profile',
            preserveNullAndEmptyArrays: true,
          },
        },

        // 4️⃣ Shape response
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            status: 1,
            avatar: '$profile.avatarUrl',
            createdAt: 1,
          },
        },

        // 5️⃣ Optional: Sort
        {
          $sort: { createdAt: -1 },
        },
      ]);

      if (!users.length) {
        Logger.error('No publisher found');
        req.flash('error', 'No publisher found');
        return res.redirect('/admin/dashboard');
      }

      return res.render('admin/users/users', {
        title: 'Admin | Publishers',
        pageTitle: 'Publishers',
        notificationsCount: 3,
        admin: {
          username: 'Susovan',
          email: 'susovan@gmail',
          avatar: {
            url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
          },
          role: 'Admin',
        },
        publishers: [
          {
            username: 'Susovan',
            email: 'susovan@gmail',
            avatar: {
              url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
            },
            role: 'publishers',
            status: UserStatus.ACTIVE,
          },
          {
            username: 'FDS',
            email: 'susovan@gmail',
            avatar: {
              url: 'https://ui-avatars.com/api/?name=Susovan&background=random&color=7FF8FF&length=1',
            },
            role: 'publishers',
            status: UserStatus.BLOCKED,
          },
          {
            username: 'Dipanwita',
            email: 'dipa@gmail.com',
            avatar: {
              url: 'https://ui-avatars.com/api/?name=Dipanwita&background=random&color=7FF8FF&length=1',
            },
            role: 'publishers',
            status: UserStatus.DISABLED,
          },
        ],
      });
    } catch (error) {
      Logger.error(error);
      req.flash('error', (error as Error).message);
      return res.redirect('/admin/dashboard');
    }
  }
  // async blockUserHandler(req: Request, res: Response) {}
  // async unblockUserHandler(req: Request, res: Response) {}
  // async disableUserHandler(req: Request, res: Response) {}
  // async enableUserHandler(req: Request, res: Response) {}
}

export default new AdminUserController();
