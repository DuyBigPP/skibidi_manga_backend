const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const { createSlug } = require('../utils/slugify.util');
const { uploadMultiple } = require('./upload.service');

/**
 * Get chapter by slug
 */
const getChapterBySlug = async (slug) => {
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
    throw new AppError('Chapter not found', 404);
  }

  return chapter;
};

/**
 * Increment chapter views
 */
const incrementChapterViews = async (chapterId, mangaId, userId = null) => {
  // Increment view count
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { totalViews: { increment: 1 } },
  });

  await prisma.manga.update({
    where: { id: mangaId },
    data: { totalViews: { increment: 1 } },
  });

  // Track view if user is logged in
  if (userId) {
    await prisma.chapterView.create({
      data: {
        chapterId,
        userId,
      },
    });
  }
};

/**
 * Get chapters by manga ID
 */
const getChaptersByMangaId = async (mangaId, options = {}) => {
  const { sortBy = 'chapterNumber', order = 'asc' } = options;

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

  return chapters;
};

/**
 * Create new chapter
 */
const createChapter = async (mangaId, chapterData, files, userId, userRole) => {
  const { chapterNumber, title } = chapterData;

  // Check if manga exists and user has permission
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
  });

  if (!manga) {
    throw new AppError('Manga not found', 404);
  }

  if (manga.uploaderId !== userId && userRole !== 'ADMIN') {
    throw new AppError('Not authorized to add chapters to this manga', 403);
  }

  // Check if chapter number already exists
  const existingChapter = await prisma.chapter.findFirst({
    where: {
      mangaId,
      chapterNumber: parseFloat(chapterNumber),
    },
  });

  if (existingChapter) {
    throw new AppError('Chapter number already exists', 400);
  }

  let images = [];

  // Upload images if files provided
  if (files && files.length > 0) {
    const folder = `manga/${mangaId}/chapter-${chapterNumber}`;
    images = await uploadMultiple(files, folder);
  } else if (chapterData.images) {
    // Or use provided URLs
    images = typeof chapterData.images === 'string' 
      ? JSON.parse(chapterData.images) 
      : chapterData.images;
  }

  if (images.length === 0) {
    throw new AppError('No images provided', 400);
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

  return chapter;
};

/**
 * Update chapter
 */
const updateChapter = async (chapterId, updateData, userId, userRole) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      manga: true,
    },
  });

  if (!chapter) {
    throw new AppError('Chapter not found', 404);
  }

  // Check ownership
  if (chapter.manga.uploaderId !== userId && userRole !== 'ADMIN') {
    throw new AppError('Not authorized to update this chapter', 403);
  }

  const updatedChapter = await prisma.chapter.update({
    where: { id: chapterId },
    data: updateData,
  });

  return updatedChapter;
};

/**
 * Delete chapter
 */
const deleteChapter = async (chapterId, userId, userRole) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      manga: true,
    },
  });

  if (!chapter) {
    throw new AppError('Chapter not found', 404);
  }

  // Check ownership
  if (chapter.manga.uploaderId !== userId && userRole !== 'ADMIN') {
    throw new AppError('Not authorized to delete this chapter', 403);
  }

  await prisma.chapter.delete({
    where: { id: chapterId },
  });

  // Update manga chapter count
  await prisma.manga.update({
    where: { id: chapter.mangaId },
    data: {
      totalChapters: { decrement: 1 },
    },
  });

  return true;
};

/**
 * Track reading progress
 */
const trackReadingProgress = async (chapterId, userId, progressData) => {
  const { currentPage, totalPages, isCompleted } = progressData;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!chapter) {
    throw new AppError('Chapter not found', 404);
  }

  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  // Upsert reading history
  const history = await prisma.readingHistory.upsert({
    where: {
      userId_chapterId: {
        userId,
        chapterId,
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
      userId,
      mangaId: chapter.mangaId,
      chapterId,
      currentPage,
      totalPages,
      progressPercent,
      isCompleted: isCompleted || false,
      lastReadAt: new Date(),
    },
  });

  return history;
};

module.exports = {
  getChapterBySlug,
  incrementChapterViews,
  getChaptersByMangaId,
  createChapter,
  updateChapter,
  deleteChapter,
  trackReadingProgress,
};

