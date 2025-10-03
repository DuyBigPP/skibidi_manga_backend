const { PrismaClient } = require('../../generated/prisma');

// Singleton pattern for Prisma Client with retry logic
let prisma;

const prismaOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  
  // Connection retry configuration for CockroachDB
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions);
} else {
  // Prevent multiple instances during development (hot reload)
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaOptions);
  }
  prisma = global.prisma;
}

// Test connection with retry
async function connectWithRetry(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      console.log(`⚠️  Database connection attempt ${i + 1}/${retries} failed`);
      if (i < retries - 1) {
        console.log(`   Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Database connection failed after all retries');
        throw error;
      }
    }
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
module.exports.connectWithRetry = connectWithRetry;
