import { Request, Response } from 'express';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

/**
 * 404 Not Found handler middleware
 */
export const notFoundHandler = (req: Request, res: Response<ApiResponse>): void => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  
  logger.warn('Route not found:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId
  });

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message,
    data: {
      availableEndpoints: {
        authentication: '/api/v1/auth',
        quizzes: '/api/v1/quiz',
        users: '/api/v1/user',
        leaderboard: '/api/v1/leaderboard',
        documentation: '/api-docs',
        health: '/health'
      }
    }
  });
};

export default notFoundHandler;
