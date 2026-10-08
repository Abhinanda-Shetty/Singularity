'use strict';

require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');

const PORT = process.env.PORT || 3000;

let server;

async function startServer() {
  try {
    // Verify database connection on startup
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`[Server] Backend running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      console.error('[Server] Server error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n[Server] ${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await disconnectDB();
        console.log('[Server] Database connection closed.');
      } catch (err) {
        console.error('[Server] Error closing DB connection:', err.message);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
