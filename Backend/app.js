'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const healthRoutes        = require('./routes/health');
const hospitalRoutes      = require('./routes/hospitals');
const medicineRoutes      = require('./routes/medicines');
const inventoryRoutes     = require('./routes/inventory');
const batchRoutes         = require('./routes/batches');
const authRoutes          = require('./routes/auth');
const entriesRoutes       = require('./routes/entries');
const requestsRoutes      = require('./routes/requests');
const demandHistoryRoutes = require('./routes/demandHistory');
const aiRoutes            = require('./routes/ai');
const { notFoundMiddleware, errorMiddleware } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// ── Core Middleware ──────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
// Pre-flight OPTIONS for all routes (Express 5 compatible wildcard)
app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api/auth',           authRoutes);
app.use('/api/hospitals',      hospitalRoutes);
app.use('/api/medicines',      medicineRoutes);
app.use('/api/inventory',      inventoryRoutes);
app.use('/api/batches',        batchRoutes);
app.use('/api/entries',        entriesRoutes);
app.use('/api/requests',       requestsRoutes);
app.use('/api/demand-history', demandHistoryRoutes);
app.use('/api/ai',             aiRoutes);


// ── 404 Middleware ────────────────────────────────────────────────
app.use(notFoundMiddleware);

// ── Centralized Error Middleware ──────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
