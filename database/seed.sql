-- Seed data for AI Quizzer application
-- Insert initial data for testing and development

-- Insert subjects
INSERT INTO subjects (id, name, description, icon) VALUES
    (uuid_generate_v4(), 'Mathematics', 'Mathematical concepts, problem solving, and numerical analysis', '🔢'),
    (uuid_generate_v4(), 'Science', 'Physics, Chemistry, Biology, and Earth Sciences', '🔬'),
    (uuid_generate_v4(), 'English', 'Language arts, literature, grammar, and writing', '📚'),
    (uuid_generate_v4(), 'History', 'World history, historical events, and civilizations', '🏛️'),
    (uuid_generate_v4(), 'Geography', 'World geography, countries, capitals, and physical features', '🌍'),
    (uuid_generate_v4(), 'Computer Science', 'Programming, algorithms, and computer technology', '💻');

-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, grade_level, email_verified) VALUES
    (uuid_generate_v4(), 'john_doe', 'john.doe@example.com', '$2a$10$rOZbGXq8G4JmU4ixPzGVy.WzZXJvJKZ1hVkQ3q8TGK6XZJYV8GXUG', 'John', 'Doe', 10, true),
    (uuid_generate_v4(), 'jane_smith', 'jane.smith@example.com', '$2a$10$rOZbGXq8G4JmU4ixPzGVy.WzZXJvJKZ1hVkQ3q8TGK6XZJYV8GXUG', 'Jane', 'Smith', 9, true),
    (uuid_generate_v4(), 'mike_johnson', 'mike.johnson@example.com', '$2a$10$rOZbGXq8G4JmU4ixPzGVy.WzZXJvJKZ1hVkQ3q8TGK6XZJYV8GXUG', 'Mike', 'Johnson', 11, true),
    (uuid_generate_v4(), 'sarah_wilson', 'sarah.wilson@example.com', '$2a$10$rOZbGXq8G4JmU4ixPzGVy.WzZXJvJKZ1hVkQ3q8TGK6XZJYV8GXUG', 'Sarah', 'Wilson', 8, true),
    (uuid_generate_v4(), 'test_user', 'test@example.com', '$2a$10$rOZbGXq8G4JmU4ixPzGVy.WzZXJvJKZ1hVkQ3q8TGK6XZJYV8GXUG', 'Test', 'User', 10, true);

-- Insert sample quizzes
DO $$
DECLARE
    math_subject_id UUID;
    science_subject_id UUID;
    english_subject_id UUID;
    quiz1_id UUID := uuid_generate_v4();
    quiz2_id UUID := uuid_generate_v4();
    quiz3_id UUID := uuid_generate_v4();
    question1_id UUID := uuid_generate_v4();
    question2_id UUID := uuid_generate_v4();
    question3_id UUID := uuid_generate_v4();
    question4_id UUID := uuid_generate_v4();
    question5_id UUID := uuid_generate_v4();
    question6_id UUID := uuid_generate_v4();
BEGIN
    -- Get subject IDs
    SELECT id INTO math_subject_id FROM subjects WHERE name = 'Mathematics';
    SELECT id INTO science_subject_id FROM subjects WHERE name = 'Science';
    SELECT id INTO english_subject_id FROM subjects WHERE name = 'English';

    -- Insert quizzes
    INSERT INTO quizzes (id, title, description, subject_id, grade_level, difficulty_level, time_limit_minutes, total_questions, total_marks) VALUES
        (quiz1_id, 'Basic Algebra Quiz', 'Test your knowledge of basic algebraic concepts', math_subject_id, 9, 'medium', 20, 2, 10),
        (quiz2_id, 'Photosynthesis and Plants', 'Understanding how plants make food and grow', science_subject_id, 8, 'easy', 15, 2, 8),
        (quiz3_id, 'Shakespeare and Literature', 'Questions about famous works and literary devices', english_subject_id, 11, 'hard', 25, 2, 12);

    -- Insert questions for Quiz 1 (Math)
    INSERT INTO questions (id, quiz_id, question_text, question_type, difficulty_level, marks, explanation, tags) VALUES
        (question1_id, quiz1_id, 'What is the value of x in the equation 2x + 5 = 15?', 'multiple_choice', 'medium', 5, 'Solve by isolating x: 2x = 15 - 5 = 10, so x = 5', ARRAY['algebra', 'equations']),
        (question2_id, quiz1_id, 'Simplify the expression: 3(x + 2) - 2x', 'multiple_choice', 'medium', 5, 'Distribute and combine like terms: 3x + 6 - 2x = x + 6', ARRAY['algebra', 'simplification']);

    -- Insert answer options for Math Quiz
    INSERT INTO answer_options (question_id, option_text, is_correct, order_index) VALUES
        (question1_id, 'x = 5', true, 1),
        (question1_id, 'x = 10', false, 2),
        (question1_id, 'x = 3', false, 3),
        (question1_id, 'x = 7', false, 4),
        (question2_id, 'x + 6', true, 1),
        (question2_id, '5x + 6', false, 2),
        (question2_id, 'x + 2', false, 3),
        (question2_id, '3x + 4', false, 4);

    -- Insert questions for Quiz 2 (Science)
    INSERT INTO questions (id, quiz_id, question_text, question_type, difficulty_level, marks, explanation, tags) VALUES
        (question3_id, quiz2_id, 'What gas do plants absorb from the atmosphere during photosynthesis?', 'multiple_choice', 'easy', 4, 'Plants absorb carbon dioxide (CO2) from the atmosphere and use it to make glucose', ARRAY['photosynthesis', 'plants', 'gases']),
        (question4_id, quiz2_id, 'Which part of the plant cell contains chlorophyll?', 'multiple_choice', 'easy', 4, 'Chloroplasts contain chlorophyll, the green pigment that captures light energy', ARRAY['plant cells', 'chlorophyll', 'organelles']);

    -- Insert answer options for Science Quiz
    INSERT INTO answer_options (question_id, option_text, is_correct, order_index) VALUES
        (question3_id, 'Carbon Dioxide', true, 1),
        (question3_id, 'Oxygen', false, 2),
        (question3_id, 'Nitrogen', false, 3),
        (question3_id, 'Water Vapor', false, 4),
        (question4_id, 'Chloroplasts', true, 1),
        (question4_id, 'Nucleus', false, 2),
        (question4_id, 'Cell Wall', false, 3),
        (question4_id, 'Vacuole', false, 4);

    -- Insert questions for Quiz 3 (English)
    INSERT INTO questions (id, quiz_id, question_text, question_type, difficulty_level, marks, explanation, tags) VALUES
        (question5_id, quiz3_id, 'Who wrote the play "Romeo and Juliet"?', 'multiple_choice', 'medium', 6, 'William Shakespeare wrote Romeo and Juliet, one of his most famous tragedies', ARRAY['shakespeare', 'plays', 'literature']),
        (question6_id, quiz3_id, 'What literary device is used in "The stars danced playfully in the moonlit sky"?', 'multiple_choice', 'hard', 6, 'Personification gives human characteristics to non-human things (stars dancing)', ARRAY['literary devices', 'personification', 'figurative language']);

    -- Insert answer options for English Quiz
    INSERT INTO answer_options (question_id, option_text, is_correct, order_index) VALUES
        (question5_id, 'William Shakespeare', true, 1),
        (question5_id, 'Charles Dickens', false, 2),
        (question5_id, 'Jane Austen', false, 3),
        (question5_id, 'Mark Twain', false, 4),
        (question6_id, 'Personification', true, 1),
        (question6_id, 'Metaphor', false, 2),
        (question6_id, 'Simile', false, 3),
        (question6_id, 'Alliteration', false, 4);

    -- Insert sample hints
    INSERT INTO quiz_hints (question_id, hint_text, difficulty_level) VALUES
        (question1_id, 'Remember to isolate the variable by performing the same operation on both sides of the equation', 'easy'),
        (question2_id, 'Use the distributive property first, then combine like terms', 'easy'),
        (question3_id, 'Think about what plants need to make their own food using sunlight', 'easy'),
        (question4_id, 'Look for the organelle that contains the green pigment in plants', 'easy'),
        (question5_id, 'Think of the most famous English playwright from the Elizabethan era', 'medium'),
        (question6_id, 'Look for human actions being given to non-human objects', 'medium');

END $$;
