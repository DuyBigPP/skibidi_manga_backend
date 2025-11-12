const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Get user's reading history with pagination
 */
const getReadingHistory = async (userId, filters) => {
  const {
    page = 1,
    limit = 20,
    mangaId,
    sortBy = 'lastReadAt',
    order = 'desc',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = { userId };
  if (mangaId) {
    where.mangaId = mangaId;
  }

  const [total, history] = await Promise.all([
    prisma.readingHistory.count({ where }),
    prisma.readingHistory.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: order },
      include: {
        manga: {
          include: {
            authors: {
              include: {
                author: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
            genres: {
              include: {
                genre: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
            _count: {
              select: {
                chapters: true,
              },
            },
          },
        },
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            slug: true,
            totalImages: true,
          },
        },
      },
    }),
  ]);

  // Format response
  const formattedHistory = history.map(item => ({
    ...item,
    manga: {
      ...item.manga,
      authors: item.manga.authors.map(a => a.author),
      genres: item.manga.genres.map(g => g.genre),
    },
  }));

  return {
    data: formattedHistory,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get continue reading list (last read chapter for each manga)
 */
const getContinueReading = async (userId, limit = 10) => {
  // Get the latest reading history for each manga
  const history = await prisma.readingHistory.findMany({
    where: { userId },
    orderBy: { lastReadAt: 'desc' },
    distinct: ['mangaId'],
    take: parseInt(limit),
    include: {
      manga: {
        include: {
          authors: {
            include: {
              author: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          genres: {
            include: {
              genre: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          _count: {
            select: {
              chapters: true,
            },
          },
        },
      },
      chapter: {
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          slug: true,
          totalImages: true,
        },
      },
    },
  });

  // Format response
  const formattedHistory = history.map(item => ({
    ...item,
    manga: {
      ...item.manga,
      authors: item.manga.authors.map(a => a.author),
      genres: item.manga.genres.map(g => g.genre),
    },
  }));

  return formattedHistory;
};

/**
 * Get reading progress for a specific manga
 */
const getMangaProgress = async (userId, mangaId) => {
  const history = await prisma.readingHistory.findMany({
    where: {
      userId,
      mangaId,
    },
    orderBy: { lastReadAt: 'desc' },
    include: {
      chapter: {
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          slug: true,
          totalImages: true,
        },
      },
    },
  });

  if (history.length === 0) {
    return null;
  }

  // Get total chapters count
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    select: {
      totalChapters: true,
      _count: {
        select: {
          chapters: true,
        },
      },
    },
  });

  // Calculate overall progress
  const totalChapters = manga?._count?.chapters || 0;
  const readChapters = history.filter(h => h.isCompleted).length;
  const progressPercent = totalChapters > 0 
    ? Math.round((readChapters / totalChapters) * 100) 
    : 0;

  return {
    lastRead: history[0],
    totalChapters,
    readChapters,
    progressPercent,
    allHistory: history,
  };
};

/**
 * Save or update reading progress
 */
const saveProgress = async (userId, chapterId, progressData) => {
  const { currentPage, totalPages, isCompleted } = progressData;

  // Get chapter and manga info
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      manga: true,
    },
  });

  if (!chapter) {
    throw new AppError('Chapter not found', 404);
  }

  // Calculate progress percentage
  const progressPercent = totalPages > 0 
    ? Math.round((currentPage / totalPages) * 100) 
    : 0;

  // Upsert reading history
  const history = await prisma.readingHistory.upsert({
    where: {
      userId_chapterId: {
        userId,
        chapterId,
      },
    },
    update: {
      currentPage: parseInt(currentPage),
      totalPages: parseInt(totalPages),
      progressPercent,
      isCompleted: isCompleted || progressPercent >= 100,
      lastReadAt: new Date(),
    },
    create: {
      userId,
      chapterId,
      mangaId: chapter.mangaId,
      currentPage: parseInt(currentPage),
      totalPages: parseInt(totalPages),
      progressPercent,
      isCompleted: isCompleted || progressPercent >= 100,
      lastReadAt: new Date(),
    },
    include: {
      chapter: {
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          slug: true,
        },
      },
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

  // Increment chapter view count
  await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      totalViews: {
        increment: 1,
      },
    },
  });

  // Update manga total views
  await prisma.manga.update({
    where: { id: chapter.mangaId },
    data: {
      totalViews: {
        increment: 1,
      },
    },
  });

  return history;
};

/**
 * Delete reading history for a chapter
 */
const deleteHistory = async (userId, historyId) => {
  const history = await prisma.readingHistory.findUnique({
    where: { id: historyId },
  });

  if (!history) {
    throw new AppError('Reading history not found', 404);
  }

  if (history.userId !== userId) {
    throw new AppError('Not authorized to delete this history', 403);
  }

  await prisma.readingHistory.delete({
    where: { id: historyId },
  });

  return true;
};

/**
 * Clear all reading history for user
 */
const clearAllHistory = async (userId) => {
  await prisma.readingHistory.deleteMany({
    where: { userId },
  });

  return true;
};

/**
 * Clear reading history for a specific manga
 */
const clearMangaHistory = async (userId, mangaId) => {
  await prisma.readingHistory.deleteMany({
    where: {
      userId,
      mangaId,
    },
  });

  return true;
};

module.exports = {
  getReadingHistory,
  getContinueReading,
  getMangaProgress,
  saveProgress,
  deleteHistory,
  clearAllHistory,
  clearMangaHistory,
};

