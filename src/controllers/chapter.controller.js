const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const asyncHandler = require('../utils/asyncHandler.util');
const { createSlug } = require('../utils/slugify.util');
const { uploadMultiple } = require('../services/upload.service');

/**
 * @desc    Get chapter by slug
 * @route   GET /api/chapters/:slug
 * @access  Public
 */
exports.getChapterBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const chapter = await prisma.chapter.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      manga: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
        },
      },
    },
  });

  if (!chapter) {
    return next(new AppError('Chapter not found', 404));
  }

  // Increment view count
  await prisma.chapter.update({
    where: { id: chapter.id },
    data: { totalViews: { increment: 1 } },
  });

  await prisma.manga.update({
    where: { id: chapter.mangaId },
    data: { totalViews: { increment: 1 } },
  });

  // Track view if user is logged in
  if (req.user) {
    await prisma.chapterView.create({
      data: {
        chapterId: chapter.id,
        userId: req.user.id,
      },
    });
  }

  res.json({
    success: true,
    data: chapter,
  });
});

/**
 * @desc    Get chapters for a manga
 * @route   GET /api/manga/:mangaId/chapters
 * @access  Public
 */
exports.getChaptersByManga = asyncHandler(async (req, res, next) => {
  const { mangaId } = req.params;
  const { sortBy = 'chapterNumber', order = 'asc' } = req.query;

  const chapters = await prisma.chapter.findMany({
    where: {
      mangaId,
      status: 'PUBLISHED',
    },
    orderBy: { [sortBy]: order },
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      slug: true,
      totalImages: true,
      totalViews: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: chapters,
  });
});

/**
 * @desc    Create new chapter (with automatic image upload)
 * @route   POST /api/manga/:mangaId/chapters
 * @access  Private (UPLOADER, ADMIN)
 */
exports.createChapter = asyncHandler(async (req, res, next) => {
  const { mangaId } = req.params;
  const { chapterNumber, title } = req.body;

  // Check if manga exists and user has permission
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
  });

  if (!manga) {
    return next(new AppError('Manga not found', 404));
  }

  if (manga.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError('Not authorized to add chapters to this manga', 403));
  }

  // Check if chapter number already exists
  const existingChapter = await prisma.chapter.findFirst({
    where: {
      mangaId,
      chapterNumber: parseFloat(chapterNumber),
    },
  });

  if (existingChapter) {
    return next(new AppError('Chapter number already exists', 400));
  }

  let images = [];

  // Upload images if files provided
  if (req.files && req.files.length > 0) {
    const folder = `manga/${mangaId}/chapter-${chapterNumber}`;
    images = await uploadMultiple(req.files, folder);
  } else if (req.body.images) {
    // Or use provided URLs
    images = typeof req.body.images === 'string' 
      ? JSON.parse(req.body.images) 
      : req.body.images;
  }

  if (images.length === 0) {
    return next(new AppError('No images provided', 400));
  }

  const slug = createSlug(`${manga.slug}-ch-${chapterNumber}`);

  // Create chapter
  const chapter = await prisma.chapter.create({
    data: {
      mangaId,
      chapterNumber: parseFloat(chapterNumber),
      title: title || `Chapter ${chapterNumber}`,
      slug,
      images,
      totalImages: images.length,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Update manga
  await prisma.manga.update({
    where: { id: mangaId },
    data: {
      totalChapters: { increment: 1 },
      lastChapterAt: new Date(),
    },
  });

  res.status(201).json({
    success: true,
    data: chapter,
  });
});

/**
 * @desc    Update chapter
 * @route   PUT /api/chapters/:id
 * @access  Private (Owner, ADMIN)
 */
exports.updateChapter = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      manga: true,
    },
  });

  if (!chapter) {
    return next(new AppError('Chapter not found', 404));
  }

  // Check ownership
  if (chapter.manga.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError('Not authorized to update this chapter', 403));
  }

  const updatedChapter = await prisma.chapter.update({
    where: { id },
    data: req.body,
  });

  res.json({
    success: true,
    data: updatedChapter,
  });
});

/**
 * @desc    Delete chapter
 * @route   DELETE /api/chapters/:id
 * @access  Private (Owner, ADMIN)
 */
exports.deleteChapter = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      manga: true,
    },
  });

  if (!chapter) {
    return next(new AppError('Chapter not found', 404));
  }

  // Check ownership
  if (chapter.manga.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError('Not authorized to delete this chapter', 403));
  }

  await prisma.chapter.delete({
    where: { id },
  });

  // Update manga chapter count
  await prisma.manga.update({
    where: { id: chapter.mangaId },
    data: {
      totalChapters: { decrement: 1 },
    },
  });

  res.json({
    success: true,
    message: 'Chapter deleted successfully',
  });
});

/**
 * @desc    Track reading progress
 * @route   POST /api/chapters/:id/progress
 * @access  Private
 */
exports.trackProgress = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { currentPage, totalPages, isCompleted } = req.body;

  const chapter = await prisma.chapter.findUnique({
    where: { id },
  });

  if (!chapter) {
    return next(new AppError('Chapter not found', 404));
  }

  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  // Upsert reading history
  const history = await prisma.readingHistory.upsert({
    where: {
      userId_chapterId: {
        userId: req.user.id,
        chapterId: id,
      },
    },
    update: {
      currentPage,
      totalPages,
      progressPercent,
      isCompleted: isCompleted || false,
      lastReadAt: new Date(),
    },
    create: {
      userId: req.user.id,
      mangaId: chapter.mangaId,
      chapterId: id,
      currentPage,
      totalPages,
      progressPercent,
      isCompleted: isCompleted || false,
      lastReadAt: new Date(),
    },
  });

  res.json({
    success: true,
    data: history,
  });
});
