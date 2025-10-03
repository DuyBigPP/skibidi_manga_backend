require('dotenv').config();
const app = require('./app');
const { connectWithRetry } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 Manga Backend Server Running     ║
  ╠════════════════════════════════════════╣
  ║   Port: ${PORT.toString().padEnd(32)} ║
  ║   Mode: ${process.env.NODE_ENV?.padEnd(32) || 'development'.padEnd(32)} ║
  ║   Docs: http://localhost:${PORT}/api-docs ║
  ╚════════════════════════════════════════╝
  `);

  // Test database connection with retry
  try {
    await connectWithRetry(5, 3000);
  } catch (error) {
    console.error('❌ Failed to connect to database after retries');
    console.error('   Server will continue running but database operations will fail\n');
    // Don't exit - let the server run for health checks
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    const prisma = require('./config/database');
    await prisma.$disconnect();
    console.log('💥 Process terminated!');
  });
});
