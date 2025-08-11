# AI Quizzer Backend

A comprehensive AI-powered Quiz Application Backend with authentication, quiz management, AI-based evaluation, and score tracking.

## 🚀 Features

### Core Features (Mandatory)
- ✅ **Authentication**: Mock authentication service with JWT tokens
- ✅ **Quiz Management**: REST API endpoints for quiz operations
- 🔄 **AI Features**: Hint generation, result suggestions, adaptive difficulty
- 🔄 **Database**: PostgreSQL with comprehensive schema
- 🔄 **Hosting**: Docker deployment ready

### Bonus Features
- 🔄 **Email Notifications**: Send quiz results via email
- ✅ **Redis Caching**: Reduced API latency
- 🔄 **Leaderboard API**: Top scores by grade/subject

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [AI Integration](#ai-integration)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Known Issues](#known-issues)

## 🛠 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+ (optional, for caching)
- Docker (optional, for containerized deployment)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-quizzer-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb ai_quizzer
   
   # Run migrations
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will be running at `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ai_quizzer
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_quizzer
DB_USER=username
DB_PASSWORD=password

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AI Service Configuration (REQUIRED)
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama3-8b-8192

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=AI Quizzer <noreply@aiquizzer.com>

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Required Environment Variables
- `JWT_SECRET`: Secret key for JWT token signing
- `GROQ_API_KEY`: API key for Groq AI service

## 🗄️ Database Setup

### PostgreSQL Schema

The application uses PostgreSQL with the following main tables:
- `users`: User accounts and profiles
- `subjects`: Quiz subjects (Math, Science, etc.)
- `quizzes`: Quiz metadata and configuration
- `questions`: Individual quiz questions
- `answer_options`: Multiple choice options
- `quiz_submissions`: User quiz attempts
- `user_answers`: Individual question responses
- `quiz_hints`: AI-generated hints
- `leaderboard`: User rankings
- `notifications`: User notifications

### Running Migrations

```bash
# Run database migrations
npm run migrate

# Or manually
npx tsx src/database/migrate.ts
```

### Sample Data

The migration includes sample data:
- 6 subjects (Math, Science, English, etc.)
- 5 sample users
- 3 sample quizzes with questions
- Sample hints and leaderboard data

## 📖 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api-docs` for complete Swagger documentation.

### Authentication Endpoints

#### POST `/api/v1/auth/login`
Mock authentication - accepts any username/password combination.

**Request:**
```json
{
  "username": "john_doe",
  "password": "any_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "gradeLevel": 10
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": "24h"
  }
}
```

#### POST `/api/v1/auth/register`
Register a new user account.

#### POST `/api/v1/auth/refresh`
Refresh access token using refresh token.

#### POST `/api/v1/auth/logout`
Logout and invalidate tokens.

#### GET `/api/v1/auth/me`
Get current user profile (requires authentication).

### Quiz Endpoints (Coming Soon)
- `GET /api/v1/quiz` - List quizzes with filters
- `POST /api/v1/quiz` - Create new quiz
- `GET /api/v1/quiz/:id` - Get quiz by ID
- `POST /api/v1/quiz/:id/submit` - Submit quiz answers
- `GET /api/v1/quiz/history` - Get quiz history
- `POST /api/v1/quiz/generate` - AI generate quiz
- `POST /api/v1/quiz/:id/hint` - Get AI hint

### Sample Requests

#### Login (Mock Authentication)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo_user",
    "password": "any_password"
  }'
```

#### Get Profile
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🤖 AI Integration

### Groq AI Service

The application integrates with Groq for AI features:

#### Setup
1. Get API key from [Groq Console](https://console.groq.com)
2. Set `GROQ_API_KEY` in environment variables
3. Configure model (default: `llama3-8b-8192`)

#### AI Features (In Development)
- **Hint Generation**: AI provides contextual hints for questions
- **Result Suggestions**: AI suggests improvement tips based on mistakes
- **Adaptive Difficulty**: Real-time difficulty adjustment based on performance
- **Quiz Generation**: AI creates quizzes based on subject and grade level

#### API Endpoints (Coming Soon)
- `POST /api/v1/quiz/:id/hint` - Get AI hint for specific question
- `POST /api/v1/quiz/generate` - Generate AI quiz
- Automatic AI feedback on quiz submission

## 🐳 Docker Deployment

### Local Docker Setup

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

   This starts:
   - Node.js application (port 3000)
   - PostgreSQL database (port 5432)
   - Redis cache (port 6379)

2. **Manual Docker build**
   ```bash
   docker build -t ai-quizzer-backend .
   docker run -p 3000:3000 ai-quizzer-backend
   ```

### Production Deployment

#### Heroku
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set GROQ_API_KEY=your-groq-key
heroku config:set DATABASE_URL=your-postgres-url

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Connect your repository
2. Set environment variables in the dashboard
3. Configure database and Redis add-ons
4. Deploy

#### AWS ECS/Fargate
1. Push Docker image to ECR
2. Create task definition
3. Configure load balancer
4. Set up RDS for PostgreSQL
5. Configure ElastiCache for Redis

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-production-secret
GROQ_API_KEY=your-groq-api-key
REDIS_URL=redis://your-redis-host:6379
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Manual Testing

#### Health Check
```bash
curl http://localhost:3000/health
```

#### API Testing with Postman
Import the provided Postman collection:
- Authentication flow
- Quiz management
- Error handling
- Performance testing

## 🚨 Known Issues

### Current Status
- ✅ Authentication system fully functional
- ✅ Database schema and migrations complete
- ✅ JWT token management working
- ✅ Redis caching implemented
- 🔄 Quiz management endpoints in development
- 🔄 AI integration in progress
- 🔄 Email notifications pending
- 🔄 Leaderboard API in development

### Issues and Limitations

1. **Mock Authentication**
   - Currently accepts any username/password
   - Production deployment should implement proper password validation
   - Password strength requirements defined but not enforced in mock mode

2. **AI Integration**
   - Groq integration architecture ready
   - Actual AI endpoints need implementation
   - Rate limiting for AI requests recommended

3. **Performance**
   - Database queries not fully optimized
   - Caching strategy needs fine-tuning
   - Connection pooling configured but may need adjustment

4. **Security**
   - Rate limiting implemented but may need adjustment
   - CORS configuration should be reviewed for production
   - Input validation comprehensive but needs testing

### Future Improvements

1. **Authentication**
   - Implement OAuth2 providers (Google, GitHub)
   - Add email verification flow
   - Implement password reset functionality

2. **AI Features**
   - Complete AI hint generation
   - Implement adaptive difficulty algorithm
   - Add AI-powered quiz generation

3. **Performance**
   - Implement database query optimization
   - Add response compression
   - Implement request deduplication

4. **Monitoring**
   - Add application performance monitoring
   - Implement error tracking
   - Add usage analytics

## 📞 Support

For questions and support:
- Email: support@aiquizzer.com
- Documentation: `/api-docs` endpoint
- Health Check: `/health` endpoint

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This is a backend assessment project demonstrating modern web development practices with Node.js, TypeScript, PostgreSQL, Redis, and AI integration. The authentication is currently mock-based for demonstration purposes.
