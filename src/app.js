const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const { errorHandler, notFound } = require('./middlewares/error.middleware');
const swaggerSpec = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const mangaRoutes = require('./routes/manga.routes');
const chapterRoutes = require('./routes/chapter.routes');
const genreRoutes = require('./routes/genre.routes');
const authorRoutes = require('./routes/author.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const readingHistoryRoutes = require('./routes/readingHistory.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers - Configure helmet to allow cross-origin resources
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS - Allow all origins for React Native and web clients
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // IMPORTANT: Must be false when origin is "*"
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// ============================================
// SWAGGER DOCUMENTATION
// ============================================

const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Manga API Documentation',
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/manga', mangaRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/reading-history', readingHistoryRoutes);
app.use('/api/upload', uploadRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Manga Backend API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      manga: '/api/manga',
      chapters: '/api/chapters',
      genres: '/api/genres',
      authors: '/api/authors',
      bookmarks: '/api/bookmarks',
      readingHistory: '/api/reading-history',
      upload: '/api/upload',
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
