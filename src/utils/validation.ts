import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

/**
 * Validation middleware generator
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach(detail => {
        const key = detail.path.join('.');
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });

      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please check your input data',
        errors
      });
      return;
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Query validation middleware generator
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach(detail => {
        const key = detail.path.join('.');
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });

      res.status(400).json({
        success: false,
        error: 'Query Validation Error',
        message: 'Please check your query parameters',
        errors
      });
      return;
    }

    // Replace req.query with validated and sanitized data
    req.query = value;
    next();
  };
};

/**
 * Params validation middleware generator
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors: Record<string, string[]> = {};
      
      error.details.forEach(detail => {
        const key = detail.path.join('.');
        if (!errors[key]) {
          errors[key] = [];
        }
        errors[key].push(detail.message);
      });

      res.status(400).json({
        success: false,
        error: 'Parameter Validation Error',
        message: 'Please check your URL parameters',
        errors
      });
      return;
    }

    // Replace req.params with validated and sanitized data
    req.params = value;
    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  optionalUuid: Joi.string().uuid().optional(),
  email: Joi.string().email().lowercase().trim().required(),
  username: Joi.string().alphanum().min(3).max(50).lowercase().trim().required(),
  password: Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  gradeLevel: Joi.number().integer().min(1).max(12).required(),
  optionalGradeLevel: Joi.number().integer().min(1).max(12).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
  optionalDifficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  questionType: Joi.string().valid('multiple_choice', 'true_false', 'short_answer', 'essay').required(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  },
  dateRange: {
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional()
  },
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
};

// Authentication schemas
export const authSchemas = {
  login: Joi.object({
    username: commonSchemas.username.allow(commonSchemas.email),
    password: Joi.string().required()
  }),

  register: Joi.object({
    username: commonSchemas.username,
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: Joi.string().min(1).max(50).trim().optional(),
    lastName: Joi.string().min(1).max(50).trim().optional(),
    gradeLevel: commonSchemas.optionalGradeLevel
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password
  })
};

// Quiz schemas
export const quizSchemas = {
  createQuiz: Joi.object({
    title: Joi.string().min(1).max(255).trim().required(),
    description: Joi.string().max(1000).trim().optional(),
    subjectId: commonSchemas.uuid,
    gradeLevel: commonSchemas.gradeLevel,
    difficultyLevel: commonSchemas.optionalDifficulty,
    timeLimitMinutes: Joi.number().integer().min(1).max(180).default(30),
    questions: Joi.array().items(
      Joi.object({
        questionText: Joi.string().min(1).max(2000).trim().required(),
        questionType: commonSchemas.questionType,
        difficultyLevel: commonSchemas.optionalDifficulty,
        marks: Joi.number().integer().min(1).max(100).default(1),
        timeLimitSeconds: Joi.number().integer().min(10).max(600).default(60),
        explanation: Joi.string().max(1000).trim().optional(),
        tags: Joi.array().items(Joi.string().trim()).optional(),
        options: Joi.array().items(
          Joi.object({
            optionText: Joi.string().min(1).max(500).trim().required(),
            isCorrect: Joi.boolean().required(),
            orderIndex: Joi.number().integer().min(0).required()
          })
        ).min(2).max(10).when('questionType', {
          is: 'multiple_choice',
          then: Joi.required(),
          otherwise: Joi.optional()
        })
      })
    ).min(1).max(100).required()
  }),

  submitQuiz: Joi.object({
    answers: Joi.array().items(
      Joi.object({
        questionId: commonSchemas.uuid,
        selectedOptionId: commonSchemas.optionalUuid,
        answerText: Joi.string().max(2000).trim().optional(),
        timeTakenSeconds: Joi.number().integer().min(0).optional(),
        hintUsed: Joi.boolean().default(false)
      })
    ).min(1).required()
  }),

  quizFilters: Joi.object({
    subject: commonSchemas.optionalUuid,
    gradeLevel: commonSchemas.optionalGradeLevel,
    difficulty: commonSchemas.optionalDifficulty,
    minMarks: Joi.number().integer().min(0).optional(),
    maxMarks: Joi.number().integer().min(0).optional(),
    fromDate: commonSchemas.dateRange.fromDate,
    toDate: commonSchemas.dateRange.toDate,
    status: Joi.string().valid('completed', 'in_progress', 'abandoned').optional(),
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit,
    sortBy: Joi.string().valid('date', 'score', 'title').default('date'),
    sortOrder: commonSchemas.sortOrder
  }),

  quizParams: Joi.object({
    id: commonSchemas.uuid
  }),

  aiQuizGeneration: Joi.object({
    subject: Joi.string().min(1).max(100).trim().required(),
    gradeLevel: commonSchemas.gradeLevel,
    difficulty: commonSchemas.difficulty,
    numberOfQuestions: Joi.number().integer().min(1).max(50).required(),
    topics: Joi.array().items(Joi.string().trim()).optional(),
    timeLimitMinutes: Joi.number().integer().min(5).max(180).default(30)
  }),

  hintRequest: Joi.object({
    questionId: commonSchemas.uuid,
    userAnswer: Joi.string().max(500).trim().optional(),
    previousHints: Joi.array().items(Joi.string()).optional()
  })
};

// User schemas
export const userSchemas = {
  updateProfile: Joi.object({
    firstName: Joi.string().min(1).max(50).trim().optional(),
    lastName: Joi.string().min(1).max(50).trim().optional(),
    gradeLevel: commonSchemas.optionalGradeLevel,
    email: commonSchemas.email.optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password
  }),

  userParams: Joi.object({
    id: commonSchemas.uuid
  })
};

// Leaderboard schemas
export const leaderboardSchemas = {
  leaderboardFilters: Joi.object({
    subject: commonSchemas.optionalUuid,
    gradeLevel: commonSchemas.optionalGradeLevel,
    limit: Joi.number().integer().min(1).max(100).default(10),
    timeRange: Joi.string().valid('week', 'month', 'year', 'all').default('all')
  })
};

export default {
  validate,
  validateQuery,
  validateParams,
  commonSchemas,
  authSchemas,
  quizSchemas,
  userSchemas,
  leaderboardSchemas
};
