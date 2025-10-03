const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Get all genres
 */
const getAllGenres = async () => {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          mangas: true,
        },
      },
    },
  });

  return genres;
};

/**
 * Get genre by slug
 */
const getGenreBySlug = async (slug) => {
  const genre = await prisma.genre.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          mangas: true,
        },
      },
    },
  });

  if (!genre) {
    throw new AppError('Genre not found', 404);
  }

  return genre;
};

/**
 * Get manga by genre
 */
const getMangaByGenre = async (slug, options = {}) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = options;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const genre = await prisma.genre.findUnique({
    where: { slug },
  });

  if (!genre) {
    throw new AppError('Genre not found', 404);
  }

  const where = {
    approvalStatus: 'APPROVED',
    genres: {
      some: {
        genreId: genre.id,
      },
    },
  };

  const [total, manga] = await Promise.all([
    prisma.manga.count({ where }),
    prisma.manga.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: order },
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
          },
        },
      },
    }),
  ]);

  const formattedManga = manga.map(m => ({
    ...m,
    authors: m.authors.map(a => a.author),
    genres: m.genres.map(g => g.genre),
  }));

  return {
    genre,
    manga: formattedManga,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

module.exports = {
  getAllGenres,
  getGenreBySlug,
  getMangaByGenre,
};

