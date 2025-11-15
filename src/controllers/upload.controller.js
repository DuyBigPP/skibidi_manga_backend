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

/**
 * @desc    Proxy image from external source (bypass CORS)
 * @route   GET /api/upload/proxy-image
 * @access  Public
 */
exports.proxyImage = asyncHandler(async (req, res, next) => {
  const { url } = req.query;

  if (!url) {
    return next(new AppError('URL parameter is required', 400));
  }

  // Validate URL format
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (error) {
    return next(new AppError('Invalid URL format', 400));
  }

  // Whitelist allowed domains (commented out to allow all domains)
  // const allowedDomains = [
  //   'mangapark.org',
  //   'mangapark.com',
  //   'mangapark.net',
  //   'mangapark.io',
  //   'xfscdn.com',
  //   'mpscdn.com',
  // ];

  // const isAllowedDomain = allowedDomains.some(domain => 
  //   urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
  // );

  // if (!isAllowedDomain) {
  //   return next(new AppError('Domain not allowed for proxying', 403));
  // }

  try {
    // Fetch image with proper headers to bypass restrictions
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://mangapark.org/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (!response.ok) {
      return next(new AppError(`Failed to fetch image: ${response.statusText}`, response.status));
    }

    // Get content type from response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set response headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      'Access-Control-Allow-Origin': '*',
      'Content-Length': buffer.length,
    });

    // Send image buffer
    res.send(buffer);
  } catch (error) {
    console.error('Proxy image error:', error);
    return next(new AppError('Failed to proxy image', 500));
  }
});

