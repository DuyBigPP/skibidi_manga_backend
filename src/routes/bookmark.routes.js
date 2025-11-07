const express = require('express');
const {
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  checkBookmark,
  toggleBookmark,
} = require('../controllers/bookmark.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookmarks
 *   description: Bookmark management for users
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Bookmark:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "cm4jqf1gs0000p8ug1s9qghp6"
 *         userId:
 *           type: string
 *           example: "cm4abc123def456ghi789jkl0"
 *         mangaId:
 *           type: string
 *           example: "cm4xyz987wvu654tsr321qpo9"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
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
 *             status:
 *               type: string
 *               enum: [ONGOING, COMPLETED, HIATUS, CANCELLED]
 *             authors:
 *               type: array
 *               items:
 *                 type: object
 *             genres:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     summary: Get user's bookmarked manga
 *     tags: [Bookmarks]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field (createdAt, updatedAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of user's bookmarks with pagination
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
 *                     $ref: '#/components/schemas/Bookmark'
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
 *         description: Unauthorized - User not logged in
 */
router.get('/', protect, getUserBookmarks);

/**
 * @swagger
 * /api/bookmarks/check/{mangaId}:
 *   get:
 *     summary: Check if manga is bookmarked by user
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *         example: "cm4xyz987wvu654tsr321qpo9"
 *     responses:
 *       200:
 *         description: Bookmark status
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
 *                     isBookmarked:
 *                       type: boolean
 *                       example: true
 *                     bookmarkId:
 *                       type: string
 *                       example: "cm4jqf1gs0000p8ug1s9qghp6"
 *       401:
 *         description: Unauthorized
 */
router.get('/check/:mangaId', protect, checkBookmark);

/**
 * @swagger
 * /api/bookmarks/toggle/{mangaId}:
 *   post:
 *     summary: Toggle bookmark (add if not exists, remove if exists)
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *         example: "cm4xyz987wvu654tsr321qpo9"
 *     responses:
 *       200:
 *         description: Bookmark toggled successfully
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
 *                     action:
 *                       type: string
 *                       enum: [added, removed]
 *                       example: "added"
 *                     isBookmarked:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Manga added to bookmarks"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Manga not found
 */
router.post('/toggle/:mangaId', protect, toggleBookmark);

/**
 * @swagger
 * /api/bookmarks/{mangaId}:
 *   post:
 *     summary: Add manga to bookmarks
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *         example: "cm4xyz987wvu654tsr321qpo9"
 *     responses:
 *       201:
 *         description: Manga added to bookmarks successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Bookmark'
 *                 message:
 *                   type: string
 *                   example: "Manga added to bookmarks"
 *       400:
 *         description: Manga already bookmarked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Manga not found
 */
router.post('/:mangaId', protect, addBookmark);

/**
 * @swagger
 * /api/bookmarks/{mangaId}:
 *   delete:
 *     summary: Remove manga from bookmarks
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *         example: "cm4xyz987wvu654tsr321qpo9"
 *     responses:
 *       200:
 *         description: Manga removed from bookmarks successfully
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
 *                   example: "Manga removed from bookmarks"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bookmark not found
 */
router.delete('/:mangaId', protect, removeBookmark);

module.exports = router;

