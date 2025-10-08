const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const asyncHandler = require('../utils/asyncHandler.util');
const { createSlug } = require('../utils/slugify.util');
const { uploadSingleImage } = require('../services/upload.service');

/**
 * @desc    Get all manga with filters, search, and pagination
 * @route   GET /api/manga
 * @access  Public
 */
exports.getAllManga = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    genre,
    author,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {
    approvalStatus: 'APPROVED',
  };

  // Search by title
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { alternativeTitles: { has: search } },
    ];
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Filter by genre
  if (genre) {
    where.genres = {
      some: {
        genre: {
          slug: genre,
        },
      },
    };
  }

  // Filter by author
  if (author) {
    where.authors = {
      some: {
        author: {
          slug: author,
        },
      },
    };
  }

  // Get total count
  const total = await prisma.manga.count({ where });

  // Get manga
  const manga = await prisma.manga.findMany({
    where,
    skip,
    take,
    orderBy: { [sortBy]: order },
    include: {
      authors: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      genres: {
        include: {
          genre: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
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

  res.json({
    success: true,
    data: formattedManga,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @desc    Get single manga by slug
 * @route   GET /api/manga/:slug
 * @access  Public
 */
exports.getMangaBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

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
    return next(new AppError('Manga not found', 404));
  }

  // Format response
  const formattedManga = {
    ...manga,
    authors: manga.authors.map(a => a.author),
    genres: manga.genres.map(g => g.genre),
  };

  res.json({
    success: true,
    data: formattedManga,
  });
});

/**
 * @desc    Get trending/popular manga
 * @route   GET /api/manga/trending
 * @access  Public
 */
exports.getTrendingManga = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

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
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      genres: {
        include: {
          genre: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
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

  res.json({
    success: true,
    data: formattedManga,
  });
});

/**
 * @desc    Get recently updated manga
 * @route   GET /api/manga/recent
 * @access  Public
 */
exports.getRecentManga = asyncHandler(async (req, res, next) => {
  const { limit = 20 } = req.query;

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
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      genres: {
        include: {
          genre: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
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

  res.json({
    success: true,
    data: formattedManga,
  });
});

/**
 * @desc    Create new manga (with optional image upload)
 * @route   POST /api/manga
 * @access  Private (UPLOADER, ADMIN)
 */
exports.createManga = asyncHandler(async (req, res, next) => {
  const {
    title,
    alternativeTitles,
    description,
    status,
    releaseYear,
    authorNames,
    genreNames,
  } = req.body;

  let thumbnail = req.body.thumbnail;
  let coverImage = req.body.coverImage;

  // Upload thumbnail if file provided
  if (req.files?.thumbnail) {
    const result = await uploadSingleImage(req.files.thumbnail[0], 'manga/covers');
    thumbnail = result.url;
  }

  // Upload cover if file provided
  if (req.files?.coverImage) {
    const result = await uploadSingleImage(req.files.coverImage[0], 'manga/covers');
    coverImage = result.url;
  }

  const slug = createSlug(title);

  // Parse arrays if they're strings (support both JSON array and comma-separated)
  const parseToArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Try JSON parse first
      if (value.trim().startsWith('[')) {
        try {
          return JSON.parse(value);
        } catch (e) {
          return [];
        }
      }
      // Otherwise split by comma
      return value.split(',').map(v => v.trim()).filter(v => v);
    }
    return [];
  };

  const authorsArray = parseToArray(authorNames);
  const genresArray = parseToArray(genreNames);
  const altTitlesArray = parseToArray(alternativeTitles);

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
      approvalStatus: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
      uploaderId: req.user.id,
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

  res.status(201).json({
    success: true,
    data: manga,
    message: req.user.role === 'ADMIN' ? 'Manga created successfully' : 'Manga submitted for approval',
  });
});

/**
 * @desc    Update manga
 * @route   PUT /api/manga/:id
 * @access  Private (Owner, ADMIN)
 */
exports.updateManga = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const manga = await prisma.manga.findUnique({
    where: { id },
  });

  if (!manga) {
    return next(new AppError('Manga not found', 404));
  }

  // Check ownership
  if (manga.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError('Not authorized to update this manga', 403));
  }

  const updatedManga = await prisma.manga.update({
    where: { id },
    data: req.body,
  });

  res.json({
    success: true,
    data: updatedManga,
  });
});

/**
 * @desc    Delete manga
 * @route   DELETE /api/manga/:id
 * @access  Private (Owner, ADMIN)
 */
exports.deleteManga = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const manga = await prisma.manga.findUnique({
    where: { id },
  });

  if (!manga) {
    return next(new AppError('Manga not found', 404));
  }

  // Check ownership
  if (manga.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(new AppError('Not authorized to delete this manga', 403));
  }

  await prisma.manga.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Manga deleted successfully',
  });
});
