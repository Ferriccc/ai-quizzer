-- AI Quizzer Database Schema
-- PostgreSQL Schema for AI-powered Quiz Application

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    time_limit_minutes INTEGER DEFAULT 30,
    total_questions INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    pass_percentage DECIMAL(5,2) DEFAULT 60.00,
    is_active BOOLEAN DEFAULT true,
    is_ai_generated BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    marks INTEGER DEFAULT 1,
    time_limit_seconds INTEGER DEFAULT 60,
    explanation TEXT,
    tags TEXT[], -- Array of tags for categorization
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Answer options table (for multiple choice questions)
CREATE TABLE answer_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz attempts/submissions table
CREATE TABLE quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'time_expired')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_taken_seconds INTEGER,
    total_score DECIMAL(5,2) DEFAULT 0.00,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT false,
    ai_feedback TEXT,
    improvement_suggestions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quiz_id, attempt_number)
);

-- User answers table
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES answer_options(id) ON DELETE SET NULL,
    answer_text TEXT, -- For short answer and essay questions
    is_correct BOOLEAN,
    marks_obtained DECIMAL(5,2) DEFAULT 0.00,
    time_taken_seconds INTEGER,
    hint_used BOOLEAN DEFAULT false,
    hint_text TEXT,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, question_id)
);

-- Quiz hints table (AI-generated hints)
CREATE TABLE quiz_hints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    hint_text TEXT NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    usage_count INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard table (materialized view for performance)
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    grade_level INTEGER,
    total_quizzes INTEGER DEFAULT 0,
    total_score DECIMAL(10,2) DEFAULT 0.00,
    average_percentage DECIMAL(5,2) DEFAULT 0.00,
    rank_position INTEGER,
    last_quiz_date TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subject_id, grade_level)
);

-- User sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('quiz_result', 'achievement', 'reminder', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_email_sent BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_grade_level ON users(grade_level);

CREATE INDEX idx_quizzes_subject_grade ON quizzes(subject_id, grade_level);
CREATE INDEX idx_quizzes_difficulty ON quizzes(difficulty_level);
CREATE INDEX idx_quizzes_active ON quizzes(is_active);

CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);

CREATE INDEX idx_answer_options_question_id ON answer_options(question_id);

CREATE INDEX idx_quiz_submissions_user_quiz ON quiz_submissions(user_id, quiz_id);
CREATE INDEX idx_quiz_submissions_status ON quiz_submissions(status);
CREATE INDEX idx_quiz_submissions_completed_at ON quiz_submissions(completed_at);

CREATE INDEX idx_user_answers_submission_id ON user_answers(submission_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);

CREATE INDEX idx_leaderboard_rank ON leaderboard(grade_level, subject_id, rank_position);
CREATE INDEX idx_leaderboard_user_subject ON leaderboard(user_id, subject_id);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_submissions_updated_at BEFORE UPDATE ON quiz_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update leaderboard entry for the user
    INSERT INTO leaderboard (user_id, subject_id, grade_level, total_quizzes, total_score, average_percentage, last_quiz_date)
    SELECT 
        NEW.user_id,
        q.subject_id,
        q.grade_level,
        COUNT(qs.id),
        SUM(qs.total_score),
        AVG(qs.percentage),
        MAX(qs.completed_at)
    FROM quiz_submissions qs
    JOIN quizzes q ON qs.quiz_id = q.id
    WHERE qs.user_id = NEW.user_id 
      AND qs.status = 'completed'
      AND q.subject_id = (SELECT subject_id FROM quizzes WHERE id = NEW.quiz_id)
      AND q.grade_level = (SELECT grade_level FROM quizzes WHERE id = NEW.quiz_id)
    GROUP BY q.subject_id, q.grade_level
    ON CONFLICT (user_id, subject_id, grade_level) 
    DO UPDATE SET
        total_quizzes = EXCLUDED.total_quizzes,
        total_score = EXCLUDED.total_score,
        average_percentage = EXCLUDED.average_percentage,
        last_quiz_date = EXCLUDED.last_quiz_date,
        updated_at = CURRENT_TIMESTAMP;

    -- Update rankings
    WITH ranked_users AS (
        SELECT 
            user_id,
            subject_id,
            grade_level,
            ROW_NUMBER() OVER (
                PARTITION BY subject_id, grade_level 
                ORDER BY average_percentage DESC, total_score DESC, last_quiz_date DESC
            ) as new_rank
        FROM leaderboard
        WHERE subject_id = (SELECT subject_id FROM quizzes WHERE id = NEW.quiz_id)
          AND grade_level = (SELECT grade_level FROM quizzes WHERE id = NEW.quiz_id)
    )
    UPDATE leaderboard l
    SET rank_position = ru.new_rank
    FROM ranked_users ru
    WHERE l.user_id = ru.user_id 
      AND l.subject_id = ru.subject_id 
      AND l.grade_level = ru.grade_level;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard on quiz completion
CREATE TRIGGER update_leaderboard_on_completion
    AFTER UPDATE OF status ON quiz_submissions
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_leaderboard_rankings();
