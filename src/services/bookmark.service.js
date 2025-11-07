const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Add manga to bookmarks
 */
const addBookmark = async (userId, mangaId) => {
  // Check if manga exists
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
  });

  if (!manga) {
    throw new AppError('Manga not found', 404);
  }

  // Check if already bookmarked
  const existingBookmark = await prisma.bookmark.findUnique({
    where: {
      userId_mangaId: {
        userId,
        mangaId,
      },
    },
  });

  if (existingBookmark) {
    throw new AppError('Manga already bookmarked', 400);
  }

  // Create bookmark
  const bookmark = await prisma.bookmark.create({
    data: {
      userId,
      mangaId,
    },
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
        },
      },
    },
  });

  // Format response
  const formattedBookmark = {
    ...bookmark,
    manga: {
      ...bookmark.manga,
      authors: bookmark.manga.authors.map(a => a.author),
      genres: bookmark.manga.genres.map(g => g.genre),
    },
  };

  return formattedBookmark;
};

/**
 * Remove manga from bookmarks
 */
const removeBookmark = async (userId, mangaId) => {
  // Check if bookmark exists
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_mangaId: {
        userId,
        mangaId,
      },
    },
  });

  if (!bookmark) {
    throw new AppError('Bookmark not found', 404);
  }

  // Delete bookmark
  await prisma.bookmark.delete({
    where: {
      userId_mangaId: {
        userId,
        mangaId,
      },
    },
  });

  return true;
};

/**
 * Get user's bookmarks
 */
const getUserBookmarks = async (userId, filters) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [total, bookmarks] = await Promise.all([
    prisma.bookmark.count({ where: { userId } }),
    prisma.bookmark.findMany({
      where: { userId },
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
                bookmarks: true,
                comments: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Format response
  const formattedBookmarks = bookmarks.map(bookmark => ({
    ...bookmark,
    manga: {
      ...bookmark.manga,
      authors: bookmark.manga.authors.map(a => a.author),
      genres: bookmark.manga.genres.map(g => g.genre),
    },
  }));

  return {
    data: formattedBookmarks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Check if manga is bookmarked by user
 */
const checkBookmark = async (userId, mangaId) => {
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_mangaId: {
        userId,
        mangaId,
      },
    },
  });

  return {
    isBookmarked: !!bookmark,
    bookmarkId: bookmark?.id || null,
  };
};

/**
 * Toggle bookmark (add if not exists, remove if exists)
 */
const toggleBookmark = async (userId, mangaId) => {
  // Check if manga exists
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
  });

  if (!manga) {
    throw new AppError('Manga not found', 404);
  }

  // Check if already bookmarked
  const existingBookmark = await prisma.bookmark.findUnique({
    where: {
      userId_mangaId: {
        userId,
        mangaId,
      },
    },
  });

  if (existingBookmark) {
    // Remove bookmark
    await prisma.bookmark.delete({
      where: {
        userId_mangaId: {
          userId,
          mangaId,
        },
      },
    });

    return {
      action: 'removed',
      isBookmarked: false,
    };
  } else {
    // Add bookmark
    await prisma.bookmark.create({
      data: {
        userId,
        mangaId,
      },
    });

    return {
      action: 'added',
      isBookmarked: true,
    };
  }
};

module.exports = {
  addBookmark,
  removeBookmark,
  getUserBookmarks,
  checkBookmark,
  toggleBookmark,
};

