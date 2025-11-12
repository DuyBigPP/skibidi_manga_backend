const asyncHandler = require('../utils/asyncHandler.util');
const readingHistoryService = require('../services/readingHistory.service');

/**
 * @desc    Get user's reading history
 * @route   GET /api/reading-history
 * @access  Private
 */
exports.getReadingHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const filters = req.query;

  const result = await readingHistoryService.getReadingHistory(userId, filters);

  res.json({
    success: true,
    ...result,
  });
});

/**
 * @desc    Get continue reading list (latest chapter for each manga)
 * @route   GET /api/reading-history/continue-reading
 * @access  Private
 */
exports.getContinueReading = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { limit = 10 } = req.query;

  const result = await readingHistoryService.getContinueReading(userId, limit);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Get reading progress for a specific manga
 * @route   GET /api/reading-history/manga/:mangaId
 * @access  Private
 */
exports.getMangaProgress = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { mangaId } = req.params;

  const result = await readingHistoryService.getMangaProgress(userId, mangaId);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * @desc    Save reading progress
 * @route   POST /api/reading-history/chapters/:chapterId
 * @access  Private
 */
exports.saveProgress = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { chapterId } = req.params;
  const progressData = req.body;

  const result = await readingHistoryService.saveProgress(userId, chapterId, progressData);

  res.json({
    success: true,
    data: result,
    message: 'Reading progress saved',
  });
});

/**
 * @desc    Delete a reading history entry
 * @route   DELETE /api/reading-history/:historyId
 * @access  Private
 */
exports.deleteHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { historyId } = req.params;

  await readingHistoryService.deleteHistory(userId, historyId);

  res.json({
    success: true,
    message: 'Reading history deleted',
  });
});

/**
 * @desc    Clear all reading history
 * @route   DELETE /api/reading-history
 * @access  Private
 */
exports.clearAllHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  await readingHistoryService.clearAllHistory(userId);

  res.json({
    success: true,
    message: 'All reading history cleared',
  });
});

/**
 * @desc    Clear reading history for a specific manga
 * @route   DELETE /api/reading-history/manga/:mangaId
 * @access  Private
 */
exports.clearMangaHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { mangaId } = req.params;

  await readingHistoryService.clearMangaHistory(userId, mangaId);

  res.json({
    success: true,
    message: 'Manga reading history cleared',
  });
});

