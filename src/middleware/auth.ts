import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, isTokenBlacklisted } from '@/utils/jwt';
import { DecodedToken } from '@/utils/jwt';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticateToken = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required',
        message: 'Please provide a valid access token in the Authorization header'
      });
      return;
    }

    // Verify the token
    let decoded: DecodedToken;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: error instanceof Error ? error.message : 'Token verification failed'
      });
      return;
    }

    // Check if token is of correct type
    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: 'Invalid token type',
        message: 'Please provide an access token'
      });
      return;
    }

    // Check if token is blacklisted (for logout functionality)
    const jti = decoded.userId; // Using userId as JTI for simplicity
    if (await isTokenBlacklisted(jti)) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked',
        message: 'Please login again'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication failed due to server error'
    });
  }
};

/**
 * Optional authentication middleware - continues if no token provided
 */
export const optionalAuth = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without user info
      next();
      return;
    }

    try {
      const decoded = verifyToken(token);
      
      if (decoded.type === 'access' && !(await isTokenBlacklisted(decoded.userId))) {
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email
        };
      }
    } catch (error) {
      // Invalid token, but continue without user info
      logger.warn('Optional auth: Invalid token provided:', error);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to check if user has specific role or permission
 */
export const authorize = (requiredRoles: string[] = []) => {
  return async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
      return;
    }

    // For now, all authenticated users have access
    // In future, implement role-based access control
    if (requiredRoles.length > 0) {
      // TODO: Implement role checking logic
      logger.info(`Role checking for roles: ${requiredRoles.join(', ')}`);
    }

    next();
  };
};

/**
 * Middleware to validate refresh token
 */
export const validateRefreshToken = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        message: 'Please provide a refresh token'
      });
      return;
    }

    let decoded: DecodedToken;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        message: error instanceof Error ? error.message : 'Refresh token verification failed'
      });
      return;
    }

    // Check if token is of correct type
    if (decoded.type !== 'refresh') {
      res.status(401).json({
        success: false,
        error: 'Invalid token type',
        message: 'Please provide a refresh token'
      });
      return;
    }

    // Check if token is blacklisted
    if (await isTokenBlacklisted(decoded.userId)) {
      res.status(401).json({
        success: false,
        error: 'Refresh token has been revoked',
        message: 'Please login again'
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error) {
    logger.error('Refresh token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Token validation failed due to server error'
    });
  }
};

/**
 * Rate limiting for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts: Map<string, { count: number; resetTime: number }> = new Map();

  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const userAttempts = attempts.get(identifier);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      // Reset or initialize attempts
      attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userAttempts.count >= maxAttempts) {
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts',
        message: `Please wait ${Math.ceil((userAttempts.resetTime - now) / 60000)} minutes before trying again`
      });
      return;
    }

    userAttempts.count++;
    next();
  };
};

export default {
  authenticateToken,
  optionalAuth,
  authorize,
  validateRefreshToken,
  authRateLimit
};
