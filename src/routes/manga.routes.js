const express = require('express');
const {
  getAllManga,
  getMangaBySlug,
  getTrendingManga,
  getRecentManga,
  createManga,
  updateManga,
  deleteManga,
} = require('../controllers/manga.controller');
const { getChaptersByManga, createChapter } = require('../controllers/chapter.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { uploadFields, uploadMultiple } = require('../middlewares/upload.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Manga
 *   description: Manga management and retrieval
 */

/**
 * @swagger
 * /api/manga:
 *   get:
 *     summary: Get all manga with filters and pagination
 *     tags: [Manga]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ONGOING, COMPLETED, HIATUS, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre slug
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author slug
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of manga with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 */
router.get('/', getAllManga);

/**
 * @swagger
 * /api/manga/trending:
 *   get:
 *     summary: Get trending manga (sorted by views and rating)
 *     tags: [Manga]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: List of trending manga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/trending', getTrendingManga);

/**
 * @swagger
 * /api/manga/recent:
 *   get:
 *     summary: Get recently updated manga
 *     tags: [Manga]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: List of recently updated manga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/recent', getRecentManga);

/**
 * @swagger
 * /api/manga/{mangaId}/chapters:
 *   get:
 *     summary: Get all chapters for a manga
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: chapterNumber
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: List of chapters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/:mangaId/chapters', getChaptersByManga);

/**
 * @swagger
 * /api/manga/{mangaId}/chapters:
 *   post:
 *     summary: Create new chapter with automatic image upload to Cloudinary
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mangaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - chapterNumber
 *               - images
 *             properties:
 *               chapterNumber:
 *                 type: number
 *                 example: 1
 *                 description: Chapter number (can be decimal like 1.5)
 *               title:
 *                 type: string
 *                 example: "Chapter 1: The Beginning"
 *                 description: Chapter title (optional)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload chapter page images (max 50 files, each max 5MB)
 *     responses:
 *       201:
 *         description: Chapter created successfully with images uploaded to Cloudinary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     chapterNumber:
 *                       type: number
 *                     title:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                     totalImages:
 *                       type: integer
 *       400:
 *         description: Validation error or chapter already exists
 *       403:
 *         description: Not authorized
 */
router.post('/:mangaId/chapters', protect, authorize('UPLOADER', 'ADMIN'), uploadMultiple, createChapter);

/**
 * @swagger
 * /api/manga/{slug}:
 *   get:
 *     summary: Get single manga by slug with full details
 *     tags: [Manga]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga slug
 *         example: monster-pet-evolution-ebb3be
 *     responses:
 *       200:
 *         description: Manga details with authors, genres, and chapters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                     thumbnail:
 *                       type: string
 *                     authors:
 *                       type: array
 *                       items:
 *                         type: object
 *                     genres:
 *                       type: array
 *                       items:
 *                         type: object
 *                     chapters:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Manga not found
 */
router.get('/:slug', getMangaBySlug);

/**
 * @swagger
 * /api/manga:
 *   post:
 *     summary: Create new manga with automatic image upload to Cloudinary
 *     tags: [Manga]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - authorNames
 *               - genreNames
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My Awesome Manga"
 *                 description: Manga title
 *               alternativeTitles:
 *                 type: string
 *                 description: JSON array string of alternative titles
 *                 example: '["Alt Title 1", "Alt Title 2"]'
 *               description:
 *                 type: string
 *                 example: "An epic story about..."
 *                 description: Manga description
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Upload thumbnail image (auto upload to Cloudinary)
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Upload cover image (auto upload to Cloudinary)
 *               status:
 *                 type: string
 *                 enum: [ONGOING, COMPLETED, HIATUS, CANCELLED]
 *                 default: ONGOING
 *                 description: Manga status
 *               releaseYear:
 *                 type: integer
 *                 example: 2025
 *                 description: Year of release
 *               authorNames:
 *                 type: string
 *                 description: JSON array string of author names
 *                 example: '["Author 1", "Author 2"]'
 *               genreNames:
 *                 type: string
 *                 description: JSON array string of genre names
 *                 example: '["Action", "Adventure", "Fantasy"]'
 *     responses:
 *       201:
 *         description: Manga created successfully (PENDING approval for UPLOADER, APPROVED for ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       403:
 *         description: Not authorized (requires UPLOADER or ADMIN role)
 */
router.post('/', protect, authorize('UPLOADER', 'ADMIN'), uploadFields, createManga);

/**
 * @swagger
 * /api/manga/{id}:
 *   put:
 *     summary: Update manga details
 *     tags: [Manga]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ONGOING, COMPLETED, HIATUS, CANCELLED]
 *     responses:
 *       200:
 *         description: Manga updated successfully
 *       403:
 *         description: Not authorized (must be owner or ADMIN)
 *       404:
 *         description: Manga not found
 */
router.put('/:id', protect, authorize('UPLOADER', 'ADMIN'), updateManga);

/**
 * @swagger
 * /api/manga/{id}:
 *   delete:
 *     summary: Delete manga
 *     tags: [Manga]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Manga ID
 *     responses:
 *       200:
 *         description: Manga deleted successfully
 *       403:
 *         description: Not authorized (must be owner or ADMIN)
 *       404:
 *         description: Manga not found
 */
router.delete('/:id', protect, authorize('UPLOADER', 'ADMIN'), deleteManga);

module.exports = router;
