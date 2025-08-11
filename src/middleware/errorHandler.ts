import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';
import { config } from '@/config/config';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let isOperational = error.isOperational || false;

  // Log the error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    // Joi validation error
    statusCode = 400;
    message = 'Validation Error';
    isOperational = true;
    
    const errors: Record<string, string[]> = {};
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        errors[key] = [error.errors![key].message];
      });
    }

    res.status(statusCode).json({
      success: false,
      error: message,
      message: 'Please check your input data',
      errors
    });
    return;
  }

  if (error.name === 'CastError') {
    // Database cast error (invalid ID format)
    statusCode = 400;
    message = 'Invalid ID format';
    isOperational = true;
  }

  if (error.code === '11000') {
    // Duplicate key error
    statusCode = 409;
    message = 'Duplicate entry found';
    isOperational = true;
    
    if (error.keyValue) {
      const field = Object.keys(error.keyValue)[0];
      message = `${field} already exists`;
    }
  }

  if (error.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'Duplicate entry found';
    isOperational = true;
  }

  if (error.code === '23503') {
    // PostgreSQL foreign key constraint violation
    statusCode = 400;
    message = 'Referenced record not found';
    isOperational = true;
  }

  if (error.code === '23502') {
    // PostgreSQL not null constraint violation
    statusCode = 400;
    message = 'Required field is missing';
    isOperational = true;
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    isOperational = true;
  }

  if (error.name === 'MulterError') {
    statusCode = 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else {
      message = 'File upload error';
    }
    isOperational = true;
  }

  // Rate limiting error
  if (error.message.includes('Too many requests')) {
    statusCode = 429;
    isOperational = true;
  }

  // Don't leak error details in production
  if (config.server.nodeEnv === 'production' && !isOperational) {
    message = 'Something went wrong';
  }

  // Send error response
  const errorResponse: ApiResponse = {
    success: false,
    error: message,
    message: getErrorMessage(statusCode)
  };

  // Include stack trace in development
  if (config.server.nodeEnv === 'development') {
    (errorResponse as any).stack = error.stack;
    (errorResponse as any).originalError = error.message;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Get appropriate error message for status code
 */
function getErrorMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request - Please check your input',
    401: 'Unauthorized - Please login to continue',
    403: 'Forbidden - You do not have permission to access this resource',
    404: 'Not Found - The requested resource was not found',
    409: 'Conflict - A resource with this information already exists',
    422: 'Unprocessable Entity - The request was well-formed but contains invalid data',
    429: 'Too Many Requests - Please slow down your requests',
    500: 'Internal Server Error - Something went wrong on our end',
    503: 'Service Unavailable - The service is temporarily unavailable'
  };

  return messages[statusCode] || 'An error occurred';
}

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise
    });
    
    // Gracefully close the server
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack
    });
    
    // Gracefully close the server
    process.exit(1);
  });
};

export default {
  errorHandler,
  asyncHandler,
  AppError,
  handleUnhandledRejection,
  handleUncaughtException
};
