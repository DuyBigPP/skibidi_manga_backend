const express = require('express');
const {
  getReadingHistory,
  getContinueReading,
  getMangaProgress,
  saveProgress,
  deleteHistory,
  clearAllHistory,
  clearMangaHistory,
} = require('../controllers/readingHistory.controller');
const { protect } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reading History
 *   description: Track user's reading progress and history
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReadingHistory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cm4jqf1gs0000p8ug1s9qghp6"
 *         userId:
 *           type: string
 *         mangaId:
 *           type: string
 *         chapterId:
 *           type: string
 *         currentPage:
 *           type: integer
 *           example: 15
 *         totalPages:
 *           type: integer
 *           example: 25
 *         progressPercent:
 *           type: number
 *           example: 60
 *         isCompleted:
 *           type: boolean
 *           example: false
 *         lastReadAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         manga:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             title:
 *               type: string
 *             slug:
 *               type: string
 *             thumbnail:
 *               type: string
 *         chapter:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             chapterNumber:
 *               type: number
 *             title:
 *               type: string
 *             slug:
 *               type: string
 */

/**
 * @swagger
 * /api/reading-history:
 *   get:
 *     summary: Get user's reading history
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: mangaId
 *         schema:
 *           type: string
 *         description: Filter by manga ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: lastReadAt
 *         description: Sort field (lastReadAt, createdAt, progressPercent)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Reading history with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReadingHistory'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, getReadingHistory);

/**
 * @swagger
 * /api/reading-history/continue-reading:
 *   get:
 *     summary: Get continue reading list (last read chapter for each manga)
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of manga to return
 *     responses:
 *       200:
 *         description: List of recently read manga with last chapter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReadingHistory'
 *       401:
 *         description: Unauthorized
 */
router.get('/continue-reading', protect, getContinueReading);

/**
 * @swagger
 * /api/reading-history/manga/{mangaId}:
 *   get:
 *     summary: Get reading progress for a specific manga
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *     responses:
 *       200:
 *         description: Reading progress details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     lastRead:
 *                       $ref: '#/components/schemas/ReadingHistory'
 *                     totalChapters:
 *                       type: integer
 *                       example: 50
 *                     readChapters:
 *                       type: integer
 *                       example: 25
 *                     progressPercent:
 *                       type: integer
 *                       example: 50
 *                     allHistory:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ReadingHistory'
 *       401:
 *         description: Unauthorized
 */
router.get('/manga/:mangaId', protect, getMangaProgress);

/**
 * @swagger
 * /api/reading-history/chapters/{chapterId}:
 *   post:
 *     summary: Save reading progress for a chapter
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPage
 *               - totalPages
 *             properties:
 *               currentPage:
 *                 type: integer
 *                 example: 15
 *                 description: Current page number user is reading
 *               totalPages:
 *                 type: integer
 *                 example: 25
 *                 description: Total pages in the chapter
 *               isCompleted:
 *                 type: boolean
 *                 example: false
 *                 description: Whether user completed reading this chapter
 *     responses:
 *       200:
 *         description: Progress saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ReadingHistory'
 *                 message:
 *                   type: string
 *                   example: "Reading progress saved"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chapter not found
 */
router.post(
  '/chapters/:chapterId',
  protect,
  [
    body('currentPage').isInt({ min: 0 }).withMessage('Current page must be a positive integer'),
    body('totalPages').isInt({ min: 1 }).withMessage('Total pages must be a positive integer'),
    body('isCompleted').optional().isBoolean().withMessage('isCompleted must be a boolean'),
  ],
  validate,
  saveProgress
);

/**
 * @swagger
 * /api/reading-history/{historyId}:
 *   delete:
 *     summary: Delete a specific reading history entry
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Reading history ID
 *     responses:
 *       200:
 *         description: History deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reading history deleted"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this history
 *       404:
 *         description: History not found
 */
router.delete('/:historyId', protect, deleteHistory);

/**
 * @swagger
 * /api/reading-history:
 *   delete:
 *     summary: Clear all reading history for the user
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All reading history cleared"
 *       401:
 *         description: Unauthorized
 */
router.delete('/', protect, clearAllHistory);

/**
 * @swagger
 * /api/reading-history/manga/{mangaId}:
 *   delete:
 *     summary: Clear reading history for a specific manga
 *     tags: [Reading History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *     responses:
 *       200:
 *         description: Manga history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Manga reading history cleared"
 *       401:
 *         description: Unauthorized
 */
router.delete('/manga/:mangaId', protect, clearMangaHistory);

module.exports = router;

