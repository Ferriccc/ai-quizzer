import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateTokenPair, blacklistToken, extractTokenFromHeader, verifyToken } from '@/utils/jwt';
import { ApiResponse, LoginRequest, RegisterRequest, User, LoginResponse } from '@/types';
import { logger } from '@/utils/logger';
import { query } from '@/config/database';
import { redisUtils } from '@/config/redis';
import { config } from '@/config/config';
import { asyncHandler, AppError } from '@/middleware/errorHandler';

/**
 * Mock login - accepts any username/password combination
 */
export const login = asyncHandler(async (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
  const { username, password }: LoginRequest = req.body;

  logger.info(`Login attempt for username: ${username}`);

  // For demo purposes, we'll create a mock user or fetch from database
  let user: User;
  
  try {
    // Try to find existing user first
    const userQuery = `
      SELECT id, username, email, first_name, last_name, grade_level, 
             is_active, email_verified, password_hash, last_login, created_at, updated_at
      FROM users 
      WHERE username = $1 OR email = $1
    `;
    
    const result = await query(userQuery, [username.toLowerCase()]);
    
    if (result.rows.length > 0) {
      const dbUser = result.rows[0];
      
      // In a real app, verify password
      // const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
      // For mock authentication, we accept any password
      const isPasswordValid = true; // Mock authentication
      
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      if (!dbUser.is_active) {
        throw new AppError('Account is disabled', 401);
      }

      user = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        gradeLevel: dbUser.grade_level,
        isActive: dbUser.is_active,
        emailVerified: dbUser.email_verified,
        lastLogin: dbUser.last_login,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      };
    } else {
      // Create a mock user for demo purposes
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = uuidv4();
      
      const insertQuery = `
        INSERT INTO users (id, username, email, password_hash, first_name, last_name, grade_level, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, email, first_name, last_name, grade_level, 
                  is_active, email_verified, created_at, updated_at
      `;
      
      const email = username.includes('@') ? username : `${username}@example.com`;
      const insertResult = await query(insertQuery, [
        newUserId,
        username.toLowerCase(),
        email.toLowerCase(),
        hashedPassword,
        'Demo',
        'User',
        10, // Default grade
        true
      ]);
      
      const newUser = insertResult.rows[0];
      user = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        gradeLevel: newUser.grade_level,
        isActive: newUser.is_active,
        emailVerified: newUser.email_verified,
        lastLogin: null,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at
      };
    }

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Store refresh token in database
    await query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        tokens.refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        req.get('User-Agent') || '',
        req.ip
      ]
    );

    // Cache user data in Redis
    await redisUtils.setJSON(`user:${user.id}`, user, 3600); // 1 hour cache

    logger.info(`User ${username} logged in successfully`);

    const responseData: LoginResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gradeLevel: user.gradeLevel,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: config.jwt.expiresIn
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Login successful'
    });

  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
});

/**
 * Register new user
 */
export const register = asyncHandler(async (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
  const { username, email, password, firstName, lastName, gradeLevel }: RegisterRequest = req.body;

  logger.info(`Registration attempt for username: ${username}, email: ${email}`);

  try {
    // Check if user already exists
    const existingUserQuery = `
      SELECT id FROM users 
      WHERE username = $1 OR email = $2
    `;
    
    const existingResult = await query(existingUserQuery, [username.toLowerCase(), email.toLowerCase()]);
    
    if (existingResult.rows.length > 0) {
      throw new AppError('Username or email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Create user
    const insertQuery = `
      INSERT INTO users (id, username, email, password_hash, first_name, last_name, grade_level, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, first_name, last_name, grade_level, 
                is_active, email_verified, created_at, updated_at
    `;
    
    const result = await query(insertQuery, [
      userId,
      username.toLowerCase(),
      email.toLowerCase(),
      hashedPassword,
      firstName || '',
      lastName || '',
      gradeLevel || 10,
      true // Auto-verify for demo
    ]);

    const newUser = result.rows[0];
    const user: User = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      gradeLevel: newUser.grade_level,
      isActive: newUser.is_active,
      emailVerified: newUser.email_verified,
      lastLogin: null,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    // Store refresh token in database
    await query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        tokens.refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        req.get('User-Agent') || '',
        req.ip
      ]
    );

    // Cache user data in Redis
    await redisUtils.setJSON(`user:${user.id}`, user, 3600); // 1 hour cache

    logger.info(`User ${username} registered successfully`);

    const responseData: LoginResponse = {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: config.jwt.expiresIn
    };

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Registration successful'
    });

  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  if (!req.user) {
    throw new AppError('User not found in request', 401);
  }

  const { userId } = req.user;
  const { refreshToken } = req.body;

  logger.info(`Token refresh attempt for user: ${userId}`);

  try {
    // Verify refresh token exists in database
    const sessionQuery = `
      SELECT id FROM user_sessions 
      WHERE user_id = $1 AND refresh_token = $2 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
    `;
    
    const sessionResult = await query(sessionQuery, [userId, refreshToken]);
    
    if (sessionResult.rows.length === 0) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Get user data
    let user = await redisUtils.getJSON<User>(`user:${userId}`);
    
    if (!user) {
      const userQuery = `
        SELECT id, username, email, first_name, last_name, grade_level, 
               is_active, email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
      
      const userResult = await query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const dbUser = userResult.rows[0];
      user = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        gradeLevel: dbUser.grade_level,
        isActive: dbUser.is_active,
        emailVerified: dbUser.email_verified,
        lastLogin: dbUser.last_login,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      };

      // Cache user data
      await redisUtils.setJSON(`user:${userId}`, user, 3600);
    }

    // Generate new access token
    const tokens = generateTokenPair({
      userId: user.id,
      username: user.username,
      email: user.email
    });

    // Update refresh token in database
    await query(
      'UPDATE user_sessions SET refresh_token = $1, expires_at = $2 WHERE user_id = $3 AND refresh_token = $4',
      [
        tokens.refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId,
        refreshToken
      ]
    );

    logger.info(`Token refreshed successfully for user: ${userId}`);

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: config.jwt.expiresIn
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  if (!req.user) {
    throw new AppError('User not found in request', 401);
  }

  const { userId } = req.user;
  const authHeader = req.headers.authorization;
  const accessToken = extractTokenFromHeader(authHeader);

  logger.info(`Logout attempt for user: ${userId}`);

  try {
    // Blacklist the current access token
    if (accessToken) {
      const decoded = verifyToken(accessToken);
      await blacklistToken(userId, decoded.exp);
    }

    // Invalidate all refresh tokens for the user
    await query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );

    // Remove user from Redis cache
    await redisUtils.del(`user:${userId}`);

    logger.info(`User ${userId} logged out successfully`);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response<ApiResponse<{ user: User }>>) => {
  if (!req.user) {
    throw new AppError('User not found in request', 401);
  }

  const { userId } = req.user;

  try {
    // Try to get user from cache first
    let user = await redisUtils.getJSON<User>(`user:${userId}`);
    
    if (!user) {
      const userQuery = `
        SELECT id, username, email, first_name, last_name, grade_level, 
               is_active, email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
      
      const result = await query(userQuery, [userId]);
      
      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const dbUser = result.rows[0];
      user = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        gradeLevel: dbUser.grade_level,
        isActive: dbUser.is_active,
        emailVerified: dbUser.email_verified,
        lastLogin: dbUser.last_login,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      };

      // Cache user data
      await redisUtils.setJSON(`user:${userId}`, user, 3600);
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    throw error;
  }
});

/**
 * Verify token
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
  if (!req.user) {
    throw new AppError('User not found in request', 401);
  }

  res.status(200).json({
    success: true,
    data: {
      valid: true,
      user: req.user
    },
    message: 'Token is valid'
  });
});

export const authController = {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  verifyToken
};

export default authController;
