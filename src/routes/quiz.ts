import { Router } from 'express';

const router = Router();

// TODO: Implement quiz routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Quiz routes - Coming soon!',
    endpoints: {
      'GET /': 'List quizzes',
      'POST /': 'Create quiz',
      'GET /:id': 'Get quiz by ID',
      'POST /:id/submit': 'Submit quiz answers',
      'GET /:id/history': 'Get quiz history',
      'POST /generate': 'AI generate quiz',
      'POST /:id/hint': 'Get AI hint for question'
    }
  });
});

export default router;
