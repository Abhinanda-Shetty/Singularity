'use strict';

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'datasets', 'medicines_catalog.json');

let catalog = [];
let catalogById = new Map();

function initCatalog() {
  if (catalog.length > 0) return;

  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const data = fs.readFileSync(CATALOG_PATH, 'utf8');
      catalog = JSON.parse(data);
      catalogById.clear();
      for (const med of catalog) {
        catalogById.set(med.id, med);
      }
      console.log(`[MedicineDataset] Loaded ${catalog.length} medicines into memory.`);
    } catch (err) {
      console.error('[MedicineDataset] Error loading catalog JSON:', err.message);
    }
  } else {
    console.warn('[MedicineDataset] Catalog JSON not found. Run scripts/loadDataset.js first.');
  }
}

// Initialize on module load
initCatalog();

/**
 * Find medicines with search, category/critical filters, and pagination.
 */
function findAll({ search, category, critical, limit = 20, offset = 0 } = {}) {
  initCatalog();

  let filtered = catalog;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.composition && m.composition.toLowerCase().includes(term)) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(term))
    );
  }

  if (category && category.trim()) {
    const cat = category.trim().toLowerCase();
    filtered = filtered.filter((m) => m.category.toLowerCase().includes(cat));
  }

  if (critical !== undefined) {
    const critBool = critical === true || critical === 'true' || critical === 1;
    filtered = filtered.filter((m) => m.critical === critBool);
  }

  const total = filtered.length;
  const rows = filtered.slice(offset, offset + limit);

  return { rows, total };
}

/**
 * Find medicine by its integer ID.
 */
function findById(id) {
  initCatalog();
  const numId = parseInt(id, 10);
  return catalogById.get(numId) || null;
}

/**
 * Return all categories present in the dataset.
 */
function getCategories() {
  initCatalog();
  const categories = new Set();
  for (const m of catalog) {
    if (m.category) categories.add(m.category);
  }
  return Array.from(categories).sort();
}

/**
 * Returns total count of loaded medicines.
 */
function getTotalCount() {
  initCatalog();
  return catalog.length;
}

module.exports = {
  findAll,
  findById,
  getCategories,
  getTotalCount,
  initCatalog,
};
