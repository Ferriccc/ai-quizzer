// Common types and interfaces for the AI Quizzer application

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: number;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  subject?: Subject;
  gradeLevel: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  timeLimitMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passPercentage: number;
  isActive: boolean;
  isAiGenerated: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  questions?: Question[];
}

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficultyLevel: 'easy' | 'medium' | 'hard';
  marks: number;
  timeLimitSeconds: number;
  explanation?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  options?: AnswerOption[];
  hints?: QuizHint[];
}

export interface AnswerOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
  createdAt: Date;
}

export interface QuizSubmission {
  id: string;
  userId: string;
  user?: User;
  quizId: string;
  quiz?: Quiz;
  attemptNumber: number;
  status: 'in_progress' | 'completed' | 'abandoned' | 'time_expired';
  startedAt: Date;
  completedAt?: Date;
  timeTakenSeconds?: number;
  totalScore: number;
  percentage: number;
  isPassed: boolean;
  aiFeedback?: string;
  improvementSuggestions?: string[];
  createdAt: Date;
  updatedAt: Date;
  answers?: UserAnswer[];
}

export interface UserAnswer {
  id: string;
  submissionId: string;
  questionId: string;
  question?: Question;
  selectedOptionId?: string;
  selectedOption?: AnswerOption;
  answerText?: string;
  isCorrect?: boolean;
  marksObtained: number;
  timeTakenSeconds?: number;
  hintUsed: boolean;
  hintText?: string;
  answeredAt: Date;
}

export interface QuizHint {
  id: string;
  questionId: string;
  hintText: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  usageCount: number;
  isAiGenerated: boolean;
  createdAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  user?: User;
  subjectId?: string;
  subject?: Subject;
  gradeLevel?: number;
  totalQuizzes: number;
  totalScore: number;
  averagePercentage: number;
  rankPosition?: number;
  lastQuizDate?: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'quiz_result' | 'achievement' | 'reminder' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  isEmailSent: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Request/Response DTOs
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: number;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
  subjectId: string;
  gradeLevel: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  timeLimitMinutes?: number;
  questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  marks?: number;
  timeLimitSeconds?: number;
  explanation?: string;
  tags?: string[];
  options?: CreateAnswerOptionRequest[];
}

export interface CreateAnswerOptionRequest {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface SubmitQuizRequest {
  answers: SubmitAnswerRequest[];
}

export interface SubmitAnswerRequest {
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  timeTakenSeconds?: number;
  hintUsed?: boolean;
}

export interface QuizFilters {
  subject?: string;
  gradeLevel?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  minMarks?: number;
  maxMarks?: number;
  fromDate?: string;
  toDate?: string;
  status?: 'completed' | 'in_progress' | 'abandoned';
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'score' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface LeaderboardFilters {
  subject?: string;
  gradeLevel?: number;
  limit?: number;
  timeRange?: 'week' | 'month' | 'year' | 'all';
}

export interface AIQuizGenerationRequest {
  subject: string;
  gradeLevel: number;
  difficulty: 'easy' | 'medium' | 'hard';
  numberOfQuestions: number;
  topics?: string[];
  timeLimitMinutes?: number;
}

export interface AIHintRequest {
  questionId: string;
  userAnswer?: string;
  previousHints?: string[];
}

export interface AIFeedbackRequest {
  submissionId: string;
  answers: UserAnswer[];
  totalScore: number;
  percentage: number;
}

export interface AIAdaptiveDifficultyRequest {
  userId: string;
  currentQuestion: Question;
  recentAnswers: UserAnswer[];
  currentStreak: number;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// JWT payload
export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

// Error types
export interface APIError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Cache keys
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  QUIZ: (id: string) => `quiz:${id}`,
  QUIZ_LIST: (filters: string) => `quizzes:${filters}`,
  LEADERBOARD: (subject?: string, grade?: number) => `leaderboard:${subject || 'all'}:${grade || 'all'}`,
  USER_STATS: (userId: string) => `user_stats:${userId}`,
  QUIZ_SUBMISSION: (id: string) => `submission:${id}`,
  HINT: (questionId: string) => `hint:${questionId}`,
} as const;

export default {
  User,
  Subject,
  Quiz,
  Question,
  AnswerOption,
  QuizSubmission,
  UserAnswer,
  QuizHint,
  LeaderboardEntry,
  UserSession,
  Notification,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateQuizRequest,
  SubmitQuizRequest,
  QuizFilters,
  LeaderboardFilters,
  AIQuizGenerationRequest,
  AIHintRequest,
  AIFeedbackRequest,
  ApiResponse,
  PaginatedResponse,
  JWTPayload,
  APIError,
  CACHE_KEYS
};
