const asyncHandler = require('../utils/asyncHandler.util');
const genreService = require('../services/genre.service');

/**
 * @desc    Get all genres
 * @route   GET /api/genres
 * @access  Public
 */
exports.getAllGenres = asyncHandler(async (req, res, next) => {
  const genres = await genreService.getAllGenres();

  res.json({
    success: true,
    data: genres,
  });
});

/**
 * @desc    Get genre by slug
 * @route   GET /api/genres/:slug
 * @access  Public
 */
exports.getGenreBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const genre = await genreService.getGenreBySlug(slug);

  res.json({
    success: true,
    data: genre,
  });
});

/**
 * @desc    Get manga by genre
 * @route   GET /api/genres/:slug/manga
 * @access  Public
 */
exports.getMangaByGenre = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const { page, limit, sortBy, order } = req.query;

  const result = await genreService.getMangaByGenre(slug, {
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

