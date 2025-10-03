const asyncHandler = require('../utils/asyncHandler.util');
const authorService = require('../services/author.service');

/**
 * @desc    Get all authors
 * @route   GET /api/authors
 * @access  Public
 */
exports.getAllAuthors = asyncHandler(async (req, res, next) => {
  const { page, limit, search } = req.query;

  const result = await authorService.getAllAuthors({
    page,
    limit,
    search,
  });

  res.json({
    success: true,
    ...result,
  });
});

/**
 * @desc    Get author by slug
 * @route   GET /api/authors/:slug
 * @access  Public
 */
exports.getAuthorBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const author = await authorService.getAuthorBySlug(slug);

  res.json({
    success: true,
    data: author,
  });
});

/**
 * @desc    Get manga by author
 * @route   GET /api/authors/:slug/manga
 * @access  Public
 */
exports.getMangaByAuthor = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const { page, limit, sortBy, order } = req.query;

  const result = await authorService.getMangaByAuthor(slug, {
    page,
    limit,
    sortBy,
    order,
  });

  res.json({
    success: true,
    ...result,
  });
});

