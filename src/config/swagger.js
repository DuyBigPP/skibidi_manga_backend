const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Manga Backend API',
      version: '1.0.0',
      description: `
        RESTful API for manga reading platform with complete features:
        - User authentication & authorization
        - Manga & chapter management
        - Upload images to Cloudinary
        - Reading progress tracking
        - Comments & ratings
        - Bookmarks & history
      `,
      contact: {
        name: 'API Support',
        email: 'support@manga.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
      {
        url: 'https://api.yourdomain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxxx123' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'UPLOADER', 'ADMIN'] },
            status: { type: 'string', enum: ['ACTIVE', 'BANNED', 'SUSPENDED'] },
            avatar: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Manga: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            alternativeTitles: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            thumbnail: { type: 'string' },
            coverImage: { type: 'string' },
            status: { type: 'string', enum: ['ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED'] },
            totalChapters: { type: 'integer' },
            totalViews: { type: 'integer' },
            averageRating: { type: 'number', format: 'float' },
            authors: { type: 'array', items: { $ref: '#/components/schemas/Author' } },
            genres: { type: 'array', items: { $ref: '#/components/schemas/Genre' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Author: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            bio: { type: 'string', nullable: true },
          },
        },
        Genre: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
          },
        },
        Chapter: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            chapterNumber: { type: 'number' },
            title: { type: 'string' },
            slug: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            totalImages: { type: 'integer' },
            totalViews: { type: 'integer' },
            publishedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            stack: { type: 'string', description: 'Only in development mode' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management endpoints',
      },
      {
        name: 'Manga',
        description: 'Manga CRUD operations and queries',
      },
      {
        name: 'Chapters',
        description: 'Chapter management and reading',
      },
      {
        name: 'Upload',
        description: 'File upload to Cloudinary',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

