const asyncHandler = require('../utils/asyncHandler.util');
const { AppError } = require('../middlewares/error.middleware');
const { uploadSingleImage, uploadMultiple } = require('../services/upload.service');

/**
 * @desc    Upload single image
 * @route   POST /api/upload/image
 * @access  Private (UPLOADER, ADMIN)
 */
exports.uploadImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image', 400));
  }

  const folder = req.body.folder || 'manga';
  const result = await uploadSingleImage(req.file, folder);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Image uploaded successfully',
  });
});

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload/images
 * @access  Private (UPLOADER, ADMIN)
 */
exports.uploadImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one image', 400));
  }

  const folder = req.body.folder || 'manga/chapters';
  const results = await uploadMultiple(req.files, folder);

  res.status(200).json({
    success: true,
    data: {
      urls: results,
      count: results.length,
    },
    message: `${results.length} images uploaded successfully`,
  });
});

/**
 * @desc    Upload manga cover
 * @route   POST /api/upload/manga-cover
 * @access  Private (UPLOADER, ADMIN)
 */
exports.uploadMangaCover = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a cover image', 400));
  }

  const result = await uploadSingleImage(req.file, 'manga/covers');

  res.status(200).json({
    success: true,
    data: result,
    message: 'Manga cover uploaded successfully',
  });
});

/**
 * @desc    Upload chapter pages
 * @route   POST /api/upload/chapter-pages
 * @access  Private (UPLOADER, ADMIN)
 */
exports.uploadChapterPages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload chapter pages', 400));
  }

  const { mangaId, chapterNumber } = req.body;
  const folder = `manga/${mangaId}/chapter-${chapterNumber}`;
  
  const results = await uploadMultiple(req.files, folder);

  res.status(200).json({
    success: true,
    data: {
      urls: results,
      count: results.length,
    },
    message: `${results.length} chapter pages uploaded successfully`,
  });
});

