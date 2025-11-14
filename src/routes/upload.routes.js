const express = require('express');
const {
  uploadImage,
  uploadImages,
  uploadMangaCover,
  uploadChapterPages,
  proxyImage,
} = require('../controllers/upload.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload to Cloudinary
 */

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload single image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 5MB)
 *               folder:
 *                 type: string
 *                 description: Cloudinary folder path
 *                 example: manga/covers
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/.../image.jpg
 *                     publicId:
 *                       type: string
 *                     width:
 *                       type: integer
 *                     height:
 *                       type: integer
 *       400:
 *         description: No file provided or invalid file type
 */
router.post('/image', protect, authorize('UPLOADER', 'ADMIN'), uploadSingle, uploadImage);

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: Upload multiple images (max 50)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Multiple image files (max 50, each max 5MB)
 *               folder:
 *                 type: string
 *                 description: Cloudinary folder path
 *                 example: manga/chapters
 *     responses:
 *       200:
 *         description: Images uploaded successfully
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
 *                     urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                     count:
 *                       type: integer
 */
router.post('/images', protect, authorize('UPLOADER', 'ADMIN'), uploadMultiple, uploadImages);

/**
 * @swagger
 * /api/upload/manga-cover:
 *   post:
 *     summary: Upload manga cover image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Manga cover image
 *     responses:
 *       200:
 *         description: Cover uploaded successfully
 */
router.post('/manga-cover', protect, authorize('UPLOADER', 'ADMIN'), uploadSingle, uploadMangaCover);

/**
 * @swagger
 * /api/upload/chapter-pages:
 *   post:
 *     summary: Upload chapter pages
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *               - mangaId
 *               - chapterNumber
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Chapter page images
 *               mangaId:
 *                 type: string
 *                 description: Manga ID
 *               chapterNumber:
 *                 type: number
 *                 description: Chapter number
 *     responses:
 *       200:
 *         description: Chapter pages uploaded successfully
 */
router.post('/chapter-pages', protect, authorize('UPLOADER', 'ADMIN'), uploadMultiple, uploadChapterPages);

/**
 * @swagger
 * /api/upload/proxy-image:
 *   get:
 *     summary: Proxy image from external source (bypass CORS for React Native)
 *     tags: [Upload]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: Image URL to proxy (must be from allowed domains)
 *         example: https://xfscdn.com/manga/example.jpg
 *     responses:
 *       200:
 *         description: Image proxied successfully
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: URL parameter missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: URL parameter is required
 *       403:
 *         description: Domain not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Domain not allowed for proxying
 *       500:
 *         description: Failed to fetch image
 */
router.get('/proxy-image', proxyImage);

module.exports = router;

