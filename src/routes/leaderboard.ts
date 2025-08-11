import { Router } from 'express';

const router = Router();

// TODO: Implement leaderboard routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Leaderboard routes - Coming soon!',
    endpoints: {
      'GET /': 'Get leaderboard',
      'GET /subject/:subjectId': 'Get leaderboard by subject',
      'GET /grade/:gradeLevel': 'Get leaderboard by grade',
      'GET /user/:userId': 'Get user ranking'
    }
  });
});

export default router;
