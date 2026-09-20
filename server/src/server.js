const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize, User } = require('./models');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const swapRoutes = require('./routes/swapRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const seedDatabase = require('./utils/seedData');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// 1. Security Headers via Helmet (with CSP configured for SPA, avatars, and fonts)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https://api.dicebear.com", "https://images.unsplash.com", "https://lh3.googleusercontent.com", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://*.googleapis.com", "https://*.firebaseio.com", "https://skill-swap-f29e2.firebaseapp.com", "*"],
      frameSrc: ["'self'", "https://skill-swap-f29e2.firebaseapp.com", "https://*.firebaseapp.com"],
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. HTTP Compression (gzip / deflate)
app.use(compression());

// 3. HTTP Request Logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// 4. Rate Limiting (Protects from DDoS & Brute-force attacks in production while keeping local development frictionless)
const isLocalOrDev = (req) => {
  if (!isProduction) return true;
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost');
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 50000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDev,
  message: { error: 'Too many requests from this IP. Please try again after a few minutes.' }
});
app.use('/api', generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalOrDev,
  message: { error: 'Too many authentication attempts. Please try again after a few minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 5. CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 6. Body Parsers (10mb limit for direct photo uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 7. Health & Readiness Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    service: 'Skill Swap API',
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// 8. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 9. Static Frontend Serving (SPA production fallback)
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(404).send('Skill Swap API is running. Frontend build in client/dist not found.');
    }
  });
});

// 10. Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: isProduction && status === 500
      ? 'An unexpected error occurred. Please try again later.'
      : (err.message || 'Internal Server Error')
  });
});

// 11. Server Initialization & Graceful Shutdown
let server;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Check if users exist; if not, seed automatically
    await sequelize.sync();
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found. Automatically seeding initial database...');
      await seedDatabase();
    } else {
      // Auto-clean any legacy repeated skills
      const { Skill } = require('./models');
      const allSkills = await Skill.findAll({ order: [['createdAt', 'ASC']] });
      const seenSkills = new Set();
      for (const s of allSkills) {
        const key = `${s.userId}::${s.type}::${(s.title || '').trim().toLowerCase()}`;
        if (seenSkills.has(key)) {
          await s.destroy();
        } else {
          seenSkills.add(key);
        }
      }
    }

    server = app.listen(PORT, () => {
      console.log(`===========================================`);
      console.log(`Skill Swap API Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===========================================`);
    });
  } catch (error) {
    console.error('Unable to connect to database or start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await sequelize.close();
        console.log('Database connections successfully closed.');
      } catch (dbErr) {
        console.error('Error closing database connections:', dbErr);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  // Force close after 10s if hanging
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully terminating.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

startServer();
