const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Get all authors
 */
const getAllAuthors = async (options = {}) => {
  const { page, limit, search } = options;

  const where = {};

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // If pagination provided
  if (page && limit) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [total, authors] = await Promise.all([
      prisma.author.count({ where }),
      prisma.author.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              mangas: true,
            },
          },
        },
      }),
    ]);

    return {
      data: authors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Return all authors without pagination
  const authors = await prisma.author.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          mangas: true,
        },
      },
    },
  });

  return { data: authors };
};

/**
 * Get author by slug
 */
const getAuthorBySlug = async (slug) => {
  const author = await prisma.author.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          mangas: true,
        },
      },
    },
  });

  if (!author) {
    throw new AppError('Author not found', 404);
  }

  return author;
};

/**
 * Get manga by author
 */
const getMangaByAuthor = async (slug, options = {}) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = options;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const author = await prisma.author.findUnique({
    where: { slug },
  });

  if (!author) {
    throw new AppError('Author not found', 404);
  }

  const where = {
    approvalStatus: 'APPROVED',
    authors: {
      some: {
        authorId: author.id,
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
    author,
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
  getAllAuthors,
  getAuthorBySlug,
  getMangaByAuthor,
};

