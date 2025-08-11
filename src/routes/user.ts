import { Router } from 'express';

const router = Router();

// TODO: Implement user routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User routes - Coming soon!',
    endpoints: {
      'GET /profile': 'Get user profile',
      'PUT /profile': 'Update user profile',
      'POST /change-password': 'Change password',
      'GET /stats': 'Get user statistics',
      'GET /notifications': 'Get user notifications',
      'PUT /notifications/:id/read': 'Mark notification as read'
    }
  });
});

export default router;
