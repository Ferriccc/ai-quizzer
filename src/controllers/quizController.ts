
import { Request, Response } from 'express';
import { getGenerativeModel } from '@/utils/gemini';
import { query } from '@/config/database';
import { logger } from '@/utils/logger';

const extractJson = (text: string): string => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    return match ? match[1] : text;
};

export const generateQuiz = async (req: Request, res: Response) => {
    const { grade, Subject, TotalQuestions, MaxScore, Difficulty } = req.body;
    const userId = (req as any).user.userId;

    if (!grade || !Subject || !TotalQuestions || !MaxScore || !Difficulty) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const subjectResult = await query('SELECT id FROM subjects WHERE name = $1', [Subject]);
        if (subjectResult.rows.length === 0) {
            return res.status(400).json({ message: `Subject ${Subject} not found` });
        }
        const subjectId = subjectResult.rows[0].id;

        const model = getGenerativeModel();
        const prompt = `Generate a quiz with ${TotalQuestions} questions for a grade ${grade} student in ${Subject} with a difficulty of ${Difficulty}. The maximum score is ${MaxScore}. Each question should have 4 options and one correct answer. Return the response in JSON format, with an array of questions, each question having id, question, options, and difficulty.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text);
        const jsonText = extractJson(text);
        console.log(jsonText);
        const quizData = JSON.parse(jsonText);
        console.log(quizData);

        const title = `${Subject} Quiz for Grade ${grade}`;

        const quizResult = await query(
            'INSERT INTO quizzes (created_by, subject_id, grade_level, total_questions, total_marks, difficulty_level, title) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [userId, subjectId, grade, TotalQuestions, MaxScore, Difficulty, title]
        );
        const quizId = quizResult.rows[0].id;

        const questions = quizData.quiz.map(async (q: any) => {
            const questionResult = await query(
                'INSERT INTO questions (quiz_id, question_text, difficulty_level) VALUES ($1, $2, $3) RETURNING id',
                [quizId, q.question, q.difficulty]
            );
            const questionId = questionResult.rows[0].id;

            await Promise.all(q.options.map((option: string, index: number) => {
                return query('INSERT INTO answer_options (question_id, option_text, is_correct, order_index) VALUES ($1, $2, $3, $4)', [questionId, option, option === q.answer, index]);
            }));

            return {
                id: questionId,
                ...q
            };
        });

        const resolvedQuestions = await Promise.all(questions);

        res.status(201).json({ quizId, gradeLevel: grade, subject: Subject, questions: resolvedQuestions });
    } catch (error) {
        logger.error('Error generating quiz:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const submitQuiz = async (req: Request, res: Response) => {
    const { quizId } = req.params;
    const { answers } = req.body;
    console.log(req.user);
    const userId = (req as any).user.userId;

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Invalid answers format' });
    }

    try {
        const quizResult = await query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
        if (quizResult.rows.length === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        const quiz = quizResult.rows[0];

        let score = 0;
        const incorrectAnswers: any[] = [];

        for (const answer of answers) {
            const { questionId, answer: userAnswer } = answer;
            const questionResult = await query('SELECT * FROM questions WHERE id = $1', [questionId]);
            const question = questionResult.rows[0];

            const optionsResult = await query('SELECT * FROM answer_options WHERE question_id = $1', [questionId]);
            const correctAnswer = optionsResult.rows.find((o: any) => o.is_correct).option_text;

            if (userAnswer === correctAnswer) {
                score++;
            } else {
                incorrectAnswers.push({ question: question.question_text, userAnswer, correctAnswer });
            }
        }

        const percentage = (score / quiz.total_questions) * 100;

        const model = getGenerativeModel();
        const prompt = `A student has completed a quiz. They got ${score} out of ${quiz.total_questions}. Here are the questions they got wrong, their answer and the correct answer: ${JSON.stringify(incorrectAnswers)}. Please provide 2 concise improvement tips for the student.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const improvementTips = text.split('\n').filter(tip => tip.length > 0);

        await query(
            'INSERT INTO quiz_submissions (quiz_id, user_id, total_score, percentage, status, completed_at, improvement_suggestions) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
            [quizId, userId, score, percentage, 'completed', improvementTips]
        );

        res.status(200).json({ quizId, score, total: quiz.total_questions, improvementTips });
    } catch (error) {
        logger.error('Error submitting quiz:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getQuizHistory = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { grade, subject, marks, completedDate, from, to } = req.query;

    try {
        let queryString = 'SELECT q.id as "quizId", q.grade_level as "gradeLevel", sub.name as subject, s.total_score as score, q.total_questions as total, s.completed_at as "completedDate" FROM quizzes q JOIN quiz_submissions s ON q.id = s.quiz_id JOIN subjects sub ON q.subject_id = sub.id WHERE s.user_id = $1';
        const queryParams: any[] = [userId];

        if (grade) {
            queryParams.push(grade);
            queryString += ` AND q.grade_level = ${queryParams.length}`;
        }
        if (subject) {
            queryParams.push(subject);
            queryString += ` AND sub.name = ${queryParams.length}`;
        }
        if (marks) {
            queryParams.push(marks);
            queryString += ` AND s.total_score = ${queryParams.length}`;
        }
        if (completedDate) {
            queryParams.push(completedDate);
            queryString += ` AND DATE(s.completed_at) = ${queryParams.length}`;
        }
        if (from) {
            queryParams.push(from);
            queryString += ` AND s.completed_at >= ${queryParams.length}`;
        }
        if (to) {
            queryParams.push(to);
            queryString += ` AND s.completed_at <= ${queryParams.length}`;
        }

        const result = await query(queryString, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        logger.error('Error getting quiz history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getHint = async (req: Request, res: Response) => {
    const { questionId } = req.params;

    try {
        const questionResult = await query('SELECT * FROM questions WHERE id = $1', [questionId]);
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }
        const question = questionResult.rows[0];

        const model = getGenerativeModel();
        const prompt = `Generate a helpful, non-revealing hint for the following question: ${question.question_text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hint = response.text();

        res.status(200).json({ questionId, hint });
    } catch (error) {
        logger.error('Error getting hint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
