const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const { createSlug } = require('../utils/slugify.util');
const { uploadSingleImage } = require('./upload.service');

/**
 * Get manga list with filters and pagination
 */
const getMangaList = async (filters) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    genre,
    author,
    sortBy = 'createdAt',
    order = 'desc',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {
    approvalStatus: 'APPROVED',
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { alternativeTitles: { has: search } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (genre) {
    where.genres = {
      some: {
        genre: { slug: genre },
      },
    };
  }

  if (author) {
    where.authors = {
      some: {
        author: { slug: author },
      },
    };
  }

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
            comments: true,
          },
        },
      },
    }),
  ]);

  // Format response
  const formattedManga = manga.map(m => ({
    ...m,
    authors: m.authors.map(a => a.author),
    genres: m.genres.map(g => g.genre),
  }));

  return {
    data: formattedManga,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get manga by slug
 */
const getMangaBySlug = async (slug) => {
  const manga = await prisma.manga.findUnique({
    where: { slug },
    include: {
      authors: {
        include: {
          author: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      chapters: {
        where: { status: 'PUBLISHED' },
        orderBy: { chapterNumber: 'asc' },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          slug: true,
          totalImages: true,
          totalViews: true,
          publishedAt: true,
        },
      },
      _count: {
        select: {
          bookmarks: true,
          comments: true,
          ratings: true,
        },
      },
    },
  });

  if (!manga) {
    throw new AppError('Manga not found', 404);
  }

  // Format response
  const formattedManga = {
    ...manga,
    authors: manga.authors.map(a => a.author),
    genres: manga.genres.map(g => g.genre),
  };

  return formattedManga;
};

/**
 * Get trending manga
 */
const getTrendingManga = async (limit = 10) => {
  const manga = await prisma.manga.findMany({
    where: {
      approvalStatus: 'APPROVED',
    },
    take: parseInt(limit),
    orderBy: [
      { totalViews: 'desc' },
      { averageRating: 'desc' },
    ],
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
  });

  const formattedManga = manga.map(m => ({
    ...m,
    authors: m.authors.map(a => a.author),
    genres: m.genres.map(g => g.genre),
  }));

  return formattedManga;
};

/**
 * Get recently updated manga
 */
const getRecentManga = async (limit = 20) => {
  const manga = await prisma.manga.findMany({
    where: {
      approvalStatus: 'APPROVED',
      lastChapterAt: { not: null },
    },
    take: parseInt(limit),
    orderBy: { lastChapterAt: 'desc' },
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
      chapters: {
        take: 1,
        orderBy: { publishedAt: 'desc' },
        select: {
          chapterNumber: true,
          title: true,
          publishedAt: true,
        },
      },
    },
  });

  const formattedManga = manga.map(m => ({
    ...m,
    authors: m.authors.map(a => a.author),
    genres: m.genres.map(g => g.genre),
    latestChapter: m.chapters[0] || null,
    chapters: undefined,
  }));

  return formattedManga;
};

/**
 * Create new manga
 */
const createManga = async (mangaData, files, userId, userRole) => {
  const {
    title,
    alternativeTitles,
    description,
    status,
    releaseYear,
    authorNames,
    genreNames,
  } = mangaData;

  let thumbnail = mangaData.thumbnail;
  let coverImage = mangaData.coverImage;

  // Upload thumbnail if file provided
  if (files?.thumbnail) {
    const result = await uploadSingleImage(files.thumbnail[0], 'manga/covers');
    thumbnail = result.url;
  }

  // Upload cover if file provided
  if (files?.coverImage) {
    const result = await uploadSingleImage(files.coverImage[0], 'manga/covers');
    coverImage = result.url;
  }

  const slug = createSlug(title);

  // Parse arrays if they're strings
  const authorsArray = typeof authorNames === 'string' ? JSON.parse(authorNames) : authorNames;
  const genresArray = typeof genreNames === 'string' ? JSON.parse(genreNames) : genreNames;
  const altTitlesArray = alternativeTitles 
    ? (typeof alternativeTitles === 'string' ? JSON.parse(alternativeTitles) : alternativeTitles)
    : [];

  // Create or connect authors
  const authorOperations = authorsArray.map(name => ({
    author: {
      connectOrCreate: {
        where: { name },
        create: {
          name,
          slug: createSlug(name),
        },
      },
    },
  }));

  // Create or connect genres
  const genreOperations = genresArray.map(name => ({
    genre: {
      connectOrCreate: {
        where: { name },
        create: {
          name,
          slug: createSlug(name),
        },
      },
    },
  }));

  // Create manga
  const manga = await prisma.manga.create({
    data: {
      title,
      slug,
      alternativeTitles: altTitlesArray,
      description,
      thumbnail,
      coverImage,
      status: status || 'ONGOING',
      releaseYear: releaseYear ? parseInt(releaseYear) : null,
      approvalStatus: userRole === 'ADMIN' ? 'APPROVED' : 'PENDING',
      uploaderId: userId,
      authors: {
        create: authorOperations,
      },
      genres: {
        create: genreOperations,
      },
    },
    include: {
      authors: {
        include: {
          author: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  return {
    manga,
    message: userRole === 'ADMIN' ? 'Manga created successfully' : 'Manga submitted for approval',
  };
};

/**
 * Update manga
 */
const updateManga = async (mangaId, updateData, userId, userRole) => {
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
  });

  if (!manga) {
    throw new AppError('Manga not found', 404);
  }

  // Check ownership
  if (manga.uploaderId !== userId && userRole !== 'ADMIN') {
    throw new AppError('Not authorized to update this manga', 403);
  }

  const updatedManga = await prisma.manga.update({
    where: { id: mangaId },
    data: updateData,
  });

  return updatedManga;
};

/**
 * Delete manga
 */
const deleteManga = async (mangaId, userId, userRole) => {
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
  });

  if (!manga) {
    throw new AppError('Manga not found', 404);
  }

  // Check ownership
  if (manga.uploaderId !== userId && userRole !== 'ADMIN') {
    throw new AppError('Not authorized to delete this manga', 403);
  }

  await prisma.manga.delete({
    where: { id: mangaId },
  });

  return true;
};

/**
 * Get random manga using Fisher-Yates shuffle algorithm
 */
const getRandomManga = async (limit = 1) => {
  // Get total count first
  const totalCount = await prisma.manga.count({
    where: { approvalStatus: 'APPROVED' },
  });

  if (totalCount === 0) {
    return [];
  }

  // Fetch all approved manga IDs
  const allManga = await prisma.manga.findMany({
    where: { approvalStatus: 'APPROVED' },
    select: { id: true },
  });

  // Shuffle using Fisher-Yates algorithm and take limit
  const shuffled = [...allManga];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedIds = shuffled.slice(0, parseInt(limit)).map(m => m.id);

  // Fetch full manga data with relations
  const manga = await prisma.manga.findMany({
    where: {
      id: { in: selectedIds },
    },
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
  });

  // Format response
  const formattedManga = manga.map(m => ({
    ...m,
    authors: m.authors.map(a => a.author),
    genres: m.genres.map(g => g.genre),
  }));

  return formattedManga;
};

module.exports = {
  getMangaList,
  getMangaBySlug,
  getTrendingManga,
  getRecentManga,
  getRandomManga,
  createManga,
  updateManga,
  deleteManga,
};
