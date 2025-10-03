const express = require('express');
const {
  getAllAuthors,
  getAuthorBySlug,
  getMangaByAuthor,
} = require('../controllers/author.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authors
 *   description: Author management and manga by author
 */

/**
 * @swagger
 * /api/authors:
 *   get:
 *     summary: Get all authors with manga count
 *     tags: [Authors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (optional, returns all if not provided)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (optional)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by author name
 *     responses:
 *       200:
 *         description: List of authors
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
 *                         example: Oda Eiichiro
 *                       slug:
 *                         type: string
 *                         example: oda-eiichiro
 *                       bio:
 *                         type: string
 *                       _count:
 *                         type: object
 *                         properties:
 *                           mangas:
 *                             type: integer
 *                 pagination:
 *                   type: object
 *                   description: Only included if page/limit provided
 */
router.get('/', getAllAuthors);

/**
 * @swagger
 * /api/authors/{slug}:
 *   get:
 *     summary: Get author details by slug
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Author slug
 *         example: oda-eiichiro
 *     responses:
 *       200:
 *         description: Author details
 *       404:
 *         description: Author not found
 */
router.get('/:slug', getAuthorBySlug);

/**
 * @swagger
 * /api/authors/{slug}/manga:
 *   get:
 *     summary: Get all manga by a specific author
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Author slug
 *         example: oda-eiichiro
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
 *         description: List of manga by author with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 author:
 *                   type: object
 *                 manga:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Author not found
 */
router.get('/:slug/manga', getMangaByAuthor);

module.exports = router;

