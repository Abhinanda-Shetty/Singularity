'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const healthRoutes    = require('./routes/health');
const hospitalRoutes  = require('./routes/hospitals');
const medicineRoutes  = require('./routes/medicines');
const inventoryRoutes = require('./routes/inventory');
const batchRoutes     = require('./routes/batches');
const { notFoundMiddleware, errorMiddleware } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// ── Core Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/batches',   batchRoutes);

// ── 404 Middleware ────────────────────────────────────────────────
app.use(notFoundMiddleware);

// ── Centralized Error Middleware ──────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
