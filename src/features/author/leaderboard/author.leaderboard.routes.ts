import { Router } from 'express';
import authorLeaderboardController from './author.leaderboard.controller.js';

const router: Router = Router();

router.get('/', authorLeaderboardController.getAuthorLeaderboard);

export default router;
