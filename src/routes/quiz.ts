import { Router } from 'express';
import { generateQuiz, submitQuiz, getQuizHistory, getHint } from '@/controllers/quizController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Quiz
 *   description: Quiz management
 */

/**
 * @swagger
 * /quizzes:
 *   post:
 *     summary: Generate a new quiz
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade: 
 *                 type: integer
 *               Subject:
 *                 type: string
 *               TotalQuestions:
 *                 type: integer
 *               MaxScore:
 *                 type: integer
 *               Difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *     responses:
 *       201:
 *         description: Quiz generated successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, generateQuiz);

/**
 * @swagger
 * /quizzes/{quizId}/submit:
 *   post:
 *     summary: Submit a quiz
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: Quiz submitted successfully
 *       400:
 *         description: Invalid answers format
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.post('/:quizId/submit', authenticateToken, submitQuiz);

/**
 * @swagger
 * /quizzes/history:
 *   get:
 *     summary: Get quiz history
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grade
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: marks
 *         schema:
 *           type: integer
 *       - in: query
 *         name: completedDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Quiz history retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/history', authenticateToken, getQuizHistory);

/**
 * @swagger
 * /quizzes/{quizId}/questions/{questionId}/hint:
 *   get:
 *     summary: Get a hint for a question
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hint retrieved successfully
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
router.get('/:quizId/questions/:questionId/hint', authenticateToken, getHint);

export default router;