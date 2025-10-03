const express = require('express');
const {
  getAllGenres,
  getGenreBySlug,
  getMangaByGenre,
} = require('../controllers/genre.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Genres
 *   description: Genre management and manga by genre
 */

/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get all genres with manga count
 *     tags: [Genres]
 *     responses:
 *       200:
 *         description: List of all genres
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                         example: Action
 *                       slug:
 *                         type: string
 *                         example: action
 *                       description:
 *                         type: string
 *                       _count:
 *                         type: object
 *                         properties:
 *                           mangas:
 *                             type: integer
 */
router.get('/', getAllGenres);

/**
 * @swagger
 * /api/genres/{slug}:
 *   get:
 *     summary: Get genre details by slug
 *     tags: [Genres]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre slug
 *         example: action
 *     responses:
 *       200:
 *         description: Genre details
 *       404:
 *         description: Genre not found
 */
router.get('/:slug', getGenreBySlug);

/**
 * @swagger
 * /api/genres/{slug}/manga:
 *   get:
 *     summary: Get all manga in a specific genre
 *     tags: [Genres]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre slug
 *         example: action
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of manga in genre with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 genre:
 *                   type: object
 *                 manga:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Genre not found
 */
router.get('/:slug/manga', getMangaByGenre);

module.exports = router;

