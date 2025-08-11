# AI Quizzer Backend - Deployment Guide

This guide provides step-by-step instructions for deploying the AI Quizzer Backend to various cloud platforms.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ running
- Redis 6+ (optional, for caching)

### Setup
1. **Clone and install**
   ```bash
   cd ai-quizzer-backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   ```

3. **Required environment variables**
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here
   GROQ_API_KEY=your-groq-api-key-here
   DATABASE_URL=postgresql://user:pass@localhost:5432/ai_quizzer
   ```

4. **Setup database**
   ```bash
   createdb ai_quizzer
   npm run migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Test the API**
   - Health check: http://localhost:3000/health
   - API docs: http://localhost:3000/api-docs
   - Import Postman collection from `postman/` folder

## ☁️ Cloud Deployment Options

### Option 1: Heroku (Recommended for Demo)

#### Step 1: Prepare for Heroku
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login
```

#### Step 2: Create Heroku App
```bash
# Create new app
heroku create your-ai-quizzer-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Add Redis addon (optional)
heroku addons:create heroku-redis:mini
```

#### Step 3: Configure Environment Variables
```bash
# Required variables
heroku config:set JWT_SECRET=your-super-secret-jwt-key-here
heroku config:set GROQ_API_KEY=your-groq-api-key-here
heroku config:set NODE_ENV=production

# Optional variables
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
```

#### Step 4: Deploy
```bash
# Add Heroku remote
git remote add heroku https://git.heroku.com/your-ai-quizzer-backend.git

# Deploy
git push heroku main

# Run database migrations
heroku run npm run migrate

# Check logs
heroku logs --tail
```

#### Step 5: Test Deployment
```bash
# Test health endpoint
curl https://your-ai-quizzer-backend.herokuapp.com/health

# Test API
curl https://your-ai-quizzer-backend.herokuapp.com/api/v1
```

### Option 2: DigitalOcean App Platform

#### Step 1: Create App
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Select the repository and branch

#### Step 2: Configure Build Settings
```yaml
# .do/app.yaml (optional)
name: ai-quizzer-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-username/ai-quizzer-backend
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: your-secret-here
    type: SECRET
  - key: GROQ_API_KEY
    value: your-groq-key
    type: SECRET

databases:
- engine: PG
  name: ai-quizzer-db
  num_nodes: 1
  size: db-s-dev-database
  version: "13"
```

#### Step 3: Add Database
1. Add PostgreSQL database from the dashboard
2. The DATABASE_URL will be automatically set

#### Step 4: Deploy
1. Click "Create Resources"
2. Wait for deployment to complete
3. Run migrations via console or API

### Option 3: AWS ECS/Fargate

#### Step 1: Build and Push Docker Image
```bash
# Build image
docker build -t ai-quizzer-backend .

# Tag for ECR
docker tag ai-quizzer-backend:latest 123456789.dkr.ecr.region.amazonaws.com/ai-quizzer-backend:latest

# Push to ECR
aws ecr get-login-password --region region | docker login --username AWS --password-stdin 123456789.dkr.ecr.region.amazonaws.com
docker push 123456789.dkr.ecr.region.amazonaws.com/ai-quizzer-backend:latest
```

#### Step 2: Create Task Definition
```json
{
  "family": "ai-quizzer-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "ai-quizzer-backend",
      "image": "123456789.dkr.ecr.region.amazonaws.com/ai-quizzer-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:123456789:secret:ai-quizzer/jwt-secret"
        },
        {
          "name": "GROQ_API_KEY", 
          "valueFrom": "arn:aws:secretsmanager:region:123456789:secret:ai-quizzer/groq-key"
        },
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:123456789:secret:ai-quizzer/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-quizzer-backend",
          "awslogs-region": "region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 3: Create ECS Service
```bash
# Create cluster
aws ecs create-cluster --cluster-name ai-quizzer-cluster

# Create service
aws ecs create-service \
  --cluster ai-quizzer-cluster \
  --service-name ai-quizzer-backend \
  --task-definition ai-quizzer-backend:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

## 🗄️ Database Setup

### PostgreSQL (Required)
All platforms need PostgreSQL. The application will automatically run migrations.

#### Local PostgreSQL
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: apt install postgresql

# Create database
createdb ai_quizzer

# Set DATABASE_URL
DATABASE_URL=postgresql://username:password@localhost:5432/ai_quizzer
```

#### Managed PostgreSQL
- **Heroku**: `heroku addons:create heroku-postgresql:mini`
- **DigitalOcean**: Add from App Platform dashboard
- **AWS**: Use RDS PostgreSQL instance

### Redis (Optional, for Caching)
Redis improves performance but is optional.

#### Local Redis
```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: apt install redis

# Start Redis
redis-server

# Set REDIS_URL
REDIS_URL=redis://localhost:6379
```

#### Managed Redis
- **Heroku**: `heroku addons:create heroku-redis:mini`
- **DigitalOcean**: Use managed Redis
- **AWS**: Use ElastiCache

## 🔧 Environment Variables Reference

### Required Variables
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
GROQ_API_KEY=your-groq-api-key-here
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Optional Variables
```env
# Redis (for caching)
REDIS_URL=redis://host:6379

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Email (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing Deployment

### Health Check
```bash
curl https://your-app-url.com/health
```

### API Test
```bash
curl https://your-app-url.com/api/v1
```

### Authentication Test
```bash
curl -X POST https://your-app-url.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

## 📊 Monitoring and Logs

### Heroku
```bash
# View logs
heroku logs --tail

# Monitor metrics
heroku addons:create newrelic:wayne
```

### DigitalOcean
- Use built-in monitoring dashboard
- Configure alerts for uptime and performance

### AWS
- CloudWatch for logs and metrics
- Set up alarms for CPU, memory, and error rates

## 🔒 Security Checklist

- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure CORS_ORIGIN for your frontend domain
- [ ] Use HTTPS in production
- [ ] Set up rate limiting
- [ ] Configure proper security headers
- [ ] Use environment variables for all secrets
- [ ] Enable database SSL connections
- [ ] Set up monitoring and alerting

## 🚨 Troubleshooting

### Common Issues

#### "Cannot connect to database"
- Check DATABASE_URL format
- Ensure database exists
- Check network connectivity
- Verify credentials

#### "JWT_SECRET is required"
- Set JWT_SECRET environment variable
- Ensure it's properly configured in your platform

#### "Rate limit exceeded"
- Check GROQ_API_KEY quota
- Implement request queuing
- Consider upgrading AI service plan

#### "Module not found" errors
- Run `npm install` 
- Check Node.js version (18+)
- Clear npm cache: `npm cache clean --force`

### Getting Help
- Check application logs first
- Review environment variables
- Test locally before deploying
- Use health check endpoint to verify service status

## 📝 Post-Deployment Checklist

- [ ] API health check passes
- [ ] Authentication endpoints working
- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] CORS configured for frontend domain
- [ ] SSL certificate installed (HTTPS)
- [ ] Monitoring and alerting configured
- [ ] API documentation accessible
- [ ] Postman collection tested against live API

Your AI Quizzer Backend is now ready for production! 🎉
