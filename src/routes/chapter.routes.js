const express = require('express');
const {
  getChapterBySlug,
  getChaptersByManga,
  createChapter,
  updateChapter,
  deleteChapter,
  trackProgress,
} = require('../controllers/chapter.controller');
const { protect, authorize, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chapters
 *   description: Chapter management and reading
 */

/**
 * @swagger
 * /api/chapters/{slug}:
 *   get:
 *     summary: Get chapter by slug (with optional auth for view tracking)
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Chapter slug
 *     responses:
 *       200:
 *         description: Chapter details with images
 *       404:
 *         description: Chapter not found
 */
router.get('/:slug', optionalAuth, getChapterBySlug);

/**
 * @swagger
 * /api/chapters/{id}:
 *   put:
 *     summary: Update chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chapter updated successfully
 */
router.put('/:id', protect, authorize('UPLOADER', 'ADMIN'), updateChapter);

/**
 * @swagger
 * /api/chapters/{id}:
 *   delete:
 *     summary: Delete chapter
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chapter deleted successfully
 */
router.delete('/:id', protect, authorize('UPLOADER', 'ADMIN'), deleteChapter);

/**
 * @swagger
 * /api/chapters/{id}/progress:
 *   post:
 *     summary: Track reading progress
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 example: 5
 *               totalPages:
 *                 type: integer
 *                 example: 20
 *               isCompleted:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Progress saved successfully
 */
router.post('/:id/progress', protect, trackProgress);

module.exports = router;

// Export function to be used in manga routes
module.exports.getChaptersByManga = getChaptersByManga;
module.exports.createChapter = createChapter;
