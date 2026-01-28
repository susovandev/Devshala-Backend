import { Application } from 'express';
import { clientRoutes } from 'features/client/client.routes.js';
import { userRouter } from 'features/user/user.routes.js';
import { authorRouter } from 'features/author/author.routes.js';
import { publisherRouter } from 'features/publisher/publisher.routes.js';
import { adminRouter } from 'features/admin/admin.routes.js';

export default function configureRoutes(app: Application) {
  app.use('/', clientRoutes);
  app.use('/users', userRouter);
  app.use('/authors', authorRouter);
  app.use('/publishers', publisherRouter);
  app.use('/admin', adminRouter);
}
