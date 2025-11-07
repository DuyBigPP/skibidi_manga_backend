const asyncHandler = require('../utils/asyncHandler.util');
const bookmarkService = require('../services/bookmark.service');

/**
 * @desc    Add manga to bookmarks
 * @route   POST /api/bookmarks/:mangaId
 * @access  Private
 */
exports.addBookmark = asyncHandler(async (req, res, next) => {
  const { mangaId } = req.params;
  const userId = req.user.id;

  const bookmark = await bookmarkService.addBookmark(userId, mangaId);

  res.status(201).json({
    success: true,
    data: bookmark,
    message: 'Manga added to bookmarks',
  });
});

/**
 * @desc    Remove manga from bookmarks
 * @route   DELETE /api/bookmarks/:mangaId
 * @access  Private
 */
exports.removeBookmark = asyncHandler(async (req, res, next) => {
  const { mangaId } = req.params;
  const userId = req.user.id;

  await bookmarkService.removeBookmark(userId, mangaId);

  res.json({
    success: true,
    message: 'Manga removed from bookmarks',
  });
});

/**
 * @desc    Get user's bookmarks
 * @route   GET /api/bookmarks
 * @access  Private
 */
exports.getUserBookmarks = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const filters = req.query;

  const result = await bookmarkService.getUserBookmarks(userId, filters);

  res.json({
    success: true,
    ...result,
  });
});

/**
 * @desc    Check if manga is bookmarked
 * @route   GET /api/bookmarks/check/:mangaId
 * @access  Private
 */
exports.checkBookmark = asyncHandler(async (req, res, next) => {
  const { mangaId } = req.params;
  const userId = req.user.id;

  const result = await bookmarkService.checkBookmark(userId, mangaId);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Toggle bookmark (add/remove)
 * @route   POST /api/bookmarks/toggle/:mangaId
 * @access  Private
 */
exports.toggleBookmark = asyncHandler(async (req, res, next) => {
  const { mangaId } = req.params;
  const userId = req.user.id;

  const result = await bookmarkService.toggleBookmark(userId, mangaId);

  res.json({
    success: true,
    data: result,
    message: result.action === 'added' 
      ? 'Manga added to bookmarks' 
      : 'Manga removed from bookmarks',
  });
});

