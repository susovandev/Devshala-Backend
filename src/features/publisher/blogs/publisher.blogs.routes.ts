import { Router } from 'express';
import publisherBlogsController from './publisher.blogs.controller.js';
import { upload } from '@config/multer.js';

const router: Router = Router();

router.get('/', publisherBlogsController.getPublisherBlogsPage);

router.get('/:id/edit', publisherBlogsController.getPublisherBlogUpdatePage);

router.patch('/:id/approval', publisherBlogsController.approveBlogHandlerByPublisher);

router.put('/:id/edit', upload.single('coverImage'), publisherBlogsController.updateBlogHandler);

export default router;
