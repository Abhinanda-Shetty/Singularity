'use strict';

/**
 * models/index.js
 * Central export for all model modules.
 * Each model is a set of raw SQL query functions using the pg pool.
 */

const Hospital    = require('./Hospital');
const Medicine    = require('./Medicine');
const Inventory   = require('./Inventory');
const Batch       = require('./Batch');

module.exports = { Hospital, Medicine, Inventory, Batch };
